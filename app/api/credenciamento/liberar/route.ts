
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { verificarPinGerente } from "@/lib/seguranca-pin";



// ==========================================
// ERRO DE CONCORRÊNCIA
// ==========================================

class IngressoNaoUtilizadoError extends Error {}

// ==========================================
// RESPOSTAS PADRONIZADAS
// ==========================================

const headers = {
  "Cache-Control": "no-store",
};

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json(
    {
      sucesso: false,
      mensagem,
    },
    {
      status,
      headers,
    }
  );
}

function respostaSucesso(dados: object) {
  return NextResponse.json(
    {
      sucesso: true,
      ...dados,
    },
    {
      headers,
    }
  );
}

// ==========================================
// LIBERAÇÃO GERENCIAL
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // ======================================
    // 1. VERIFICAR SESSÃO
    // ======================================

    const session = await getSession();

    if (!session) {
      return respostaErro(
        "Faça login novamente.",
        401
      );
    }

    if (session.role !== "FUNCIONARIO") {
      return respostaErro(
        "Operação disponível apenas no credenciamento.",
        403
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: session.id,
      },
      select: {
        ativo: true,
        role: true,
      },
    });

    if (!usuario?.ativo || usuario.role !== "FUNCIONARIO") {
      return respostaErro(
        "Acesso não autorizado.",
        403
      );
    }

    // ======================================
    // 2. VALIDAR DADOS
    // ======================================

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return respostaErro(
        "Dados inválidos.",
        400
      );
    }

    const {
      qrToken,
      funcionarioNumero,
      motivo,
      pinGerente,
    } = body;

    if (
      typeof qrToken !== "string" ||
      !/^[a-f0-9]{64}$/i.test(qrToken)
    ) {
      return respostaErro(
        "QR Code inválido.",
        400
      );
    }

    if (
      !Number.isInteger(funcionarioNumero) ||
      ![1, 2, 3].includes(funcionarioNumero)
    ) {
      return respostaErro(
        "Funcionário inválido.",
        400
      );
    }

    if (
      typeof motivo !== "string" ||
      motivo.trim().length < 5 ||
      motivo.trim().length > 500
    ) {
      return respostaErro(
        "Informe um motivo de 5 a 500 caracteres.",
        400
      );
    }

    // ======================================
    // 3. VERIFICAR CONFIGURAÇÃO DO PIN
    // ======================================

    if (!process.env.GERENTE_PIN_HASH) {
      console.error(
        "GERENTE_PIN_HASH não configurado."
      );

      return respostaErro(
        "Autorização gerencial indisponível.",
        503
      );
    }

    // ======================================
    // 4. IDENTIFICAR GERENTE ATIVO
    // ======================================

    const gerente = await prisma.usuario.findUnique({
      where: {
        email: "gerente@credenciamento.local",
      },
      select: {
        id: true,
        ativo: true,
        role: true,
      },
    });

    if (
      !gerente ||
      !gerente.ativo ||
      gerente.role !== "ADMIN"
    ) {
      return respostaErro(
        "Gerente não autorizado.",
        403
      );
    }

    // ======================================
    // 5. LOCALIZAR INGRESSO DE ESCOLA
    // ======================================

    // Esta consulta é intencionalmente feita
    // apenas no modelo "ingresso".
    //
    // Não consultar ingressoConvidado nem
    // ingressoImprensa nesta operação.

    const ingresso = await prisma.ingresso.findUnique({
      where: {
        qrToken,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!ingresso) {
      return respostaErro(
        "Ingresso não encontrado ou não elegível para liberação gerencial.",
        404
      );
    }

    if (ingresso.status !== "UTILIZADO") {
      return respostaErro(
        "Somente ingressos utilizados podem ser liberados.",
        409
      );
    }

    // ======================================
    // 6. VALIDAR PIN COM LIMITE DE TENTATIVAS
    // ======================================

    const resultadoPin = await verificarPinGerente({
      pin:
        typeof pinGerente === "string" &&
        /^\d{8}$/.test(pinGerente)
          ? pinGerente
          : "",
      funcionarioId: session.id,
      funcionarioNumero,
      ingressoId: ingresso.id,
    });

    if (resultadoPin.bloqueado) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "PIN gerencial temporariamente bloqueado. Aguarde 15 minutos.",
          bloqueado: true,
          bloqueadoAte: resultadoPin.bloqueadoAte,
          tentativasRestantes: 0,
        },
        {
          status: 429,
          headers,
        }
      );
    }

    if (!resultadoPin.autorizado) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Autorização gerencial inválida.",
          tentativasRestantes:
            resultadoPin.tentativasRestantes,
        },
        {
          status: 403,
          headers,
        }
      );
    }

    // ======================================
    // 7. LIBERAR INGRESSO
    // ======================================

    const liberacao = await prisma.$transaction(
      async (tx) => {
        // Impedir duas liberações simultâneas.

        const resultado = await tx.ingresso.updateMany({
          where: {
            id: ingresso.id,
            status: "UTILIZADO",
          },
          data: {
            status: "DISPONIVEL",
          },
        });

        if (resultado.count !== 1) {
          throw new IngressoNaoUtilizadoError();
        }

        // Localizar última entrada da escola.

        const entradaAnterior = await tx.entrada.findFirst({
          where: {
            ingressoId: ingresso.id,
          },
          orderBy: [
            { horario: "desc" },
            { id: "desc" },
          ],
          select: {
            id: true,
          },
        });

        // Registrar a autorização no histórico.

        return tx.liberacaoIngresso.create({
          data: {
            ingressoId: ingresso.id,
            gerenteId: gerente.id,
            funcionarioNumero,
            motivo: motivo.trim(),
            entradaAnteriorId:
              entradaAnterior?.id ?? null,
          },
        });
      }
    );

    // ======================================
    // 8. RETORNAR SUCESSO
    // ======================================

    return respostaSucesso({
      mensagem: "INGRESSO LIBERADO COM SUCESSO!",
      liberacao: {
        id: liberacao.id,
        funcionarioNumero:
          liberacao.funcionarioNumero,
        autorizadoEm: liberacao.autorizadoEm,
      },
    });
  } catch (error) {
    if (error instanceof IngressoNaoUtilizadoError) {
      return respostaErro(
        "Este ingresso já foi liberado.",
        409
      );
    }

    console.error("Erro ao liberar ingresso:", error);

    return respostaErro(
      "Erro interno ao liberar ingresso.",
      500
    );
  }
}
