
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ==========================================
// ERRO DE CONCORRÊNCIA
// ==========================================

class IngressoIndisponivelError extends Error {}

// ==========================================
// RESPOSTA DE ERRO
// ==========================================

function respostaErro(
  mensagem: string,
  status: number
) {
  return NextResponse.json(
    {
      sucesso: false,
      mensagem,
    },
    { status }
  );
}

// ==========================================
// CONFIRMAR ENTRADA
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // ======================================
    // 1. VERIFICAR SESSÃO
    // ======================================

    const session = await getSession();

    if (!session) {
      return respostaErro(
        "Sessão expirada. Faça login novamente.",
        401
      );
    }

    if (session.role !== "FUNCIONARIO") {
      return respostaErro(
        "Operação disponível apenas para funcionários.",
        403
      );
    }

    // ======================================
    // 2. VERIFICAR USUÁRIO NO BANCO
    // ======================================

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        ativo: true,
        role: true,
      },
    });

    if (
      !usuario ||
      !usuario.ativo ||
      usuario.role !== "FUNCIONARIO"
    ) {
      return respostaErro(
        "Usuário sem autorização.",
        403
      );
    }

    // ======================================
    // 3. VALIDAR CORPO DA REQUISIÇÃO
    // ======================================

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return respostaErro(
        "Dados da requisição inválidos.",
        400
      );
    }

    const {
      qrToken,
      nome,
      sobrenome,
      funcionarioNumero,
    } = body;

    // ======================================
    // 4. VALIDAR QR CODE
    // ======================================

    if (
      typeof qrToken !== "string" ||
      !/^[a-f0-9]{64}$/i.test(qrToken)
    ) {
      return respostaErro(
        "QR Code inválido.",
        400
      );
    }

    // ======================================
    // 5. VALIDAR NOME E SOBRENOME
    // ======================================

    if (
      typeof nome !== "string" ||
      typeof sobrenome !== "string"
    ) {
      return respostaErro(
        "Informe nome e sobrenome válidos.",
        400
      );
    }

    const nomeLimpo = nome.trim();
    const sobrenomeLimpo = sobrenome.trim();

    if (
      nomeLimpo.length === 0 ||
      sobrenomeLimpo.length === 0 ||
      nomeLimpo.length > 100 ||
      sobrenomeLimpo.length > 100
    ) {
      return respostaErro(
        "Informe nome e sobrenome válidos.",
        400
      );
    }

    // ======================================
    // 6. VALIDAR NÚMERO DO FUNCIONÁRIO
    // ======================================

    if (
      !Number.isInteger(funcionarioNumero) ||
      ![1, 2, 3].includes(funcionarioNumero)
    ) {
      return respostaErro(
        "Funcionário inválido.",
        400
      );
    }

    // ======================================
    // 7. LOCALIZAR INGRESSO
    // ======================================

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
        "Ingresso não encontrado.",
        404
      );
    }

    if (ingresso.status === "UTILIZADO") {
      return respostaErro(
        "INGRESSO JÁ UTILIZADO",
        409
      );
    }

    if (ingresso.status === "CANCELADO") {
      return respostaErro(
        "INGRESSO CANCELADO",
        409
      );
    }

    // ======================================
    // 8. TRANSAÇÃO ATÔMICA
    // ======================================

    const entrada = await prisma.$transaction(
      async (tx) => {
        // A condição DISPONIVEL é fundamental:
        // somente uma requisição simultânea
        // poderá atualizar o ingresso.

        const resultado = await tx.ingresso.updateMany({
          where: {
            id: ingresso.id,
            status: "DISPONIVEL",
          },
          data: {
            status: "UTILIZADO",
          },
        });

        if (resultado.count !== 1) {
          throw new IngressoIndisponivelError();
        }

        // Criar a entrada na mesma transação.
        // Se esta operação falhar, a atualização
        // do ingresso também será revertida.

        return tx.entrada.create({
          data: {
            nome: nomeLimpo,
            sobrenome: sobrenomeLimpo,
            ingressoId: ingresso.id,
            usuarioId: usuario.id,
            funcionarioNumero,
          },
        });
      }
    );

    // ======================================
    // 9. CONFIRMAÇÃO
    // ======================================

    return NextResponse.json({
      sucesso: true,
      mensagem: "ENTRADA CONFIRMADA COM SUCESSO!",
      entrada: {
        id: entrada.id,
        nome: entrada.nome,
        sobrenome: entrada.sobrenome,
        funcionarioNumero:
          entrada.funcionarioNumero,
        horario: entrada.horario,
      },
    });
  } catch (error) {
    // ======================================
    // 10. CONFLITO ENTRE FUNCIONÁRIOS
    // ======================================

    if (error instanceof IngressoIndisponivelError) {
      return respostaErro(
        "Este ingresso já foi utilizado ou está indisponível.",
        409
      );
    }

    // ======================================
    // 11. ERRO INTERNO
    // ======================================

    console.error(
      "Erro ao confirmar entrada:",
      error
    );

    return respostaErro(
      "Erro interno ao confirmar entrada.",
      500
    );
  }
}
