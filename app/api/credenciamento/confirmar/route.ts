
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
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
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
    // 7. BUSCAR INGRESSO DE ESCOLA
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

    // ======================================
    // 8. FLUXO ORIGINAL DAS ESCOLAS
    // ======================================

    if (ingresso) {
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

      // Mantemos a mesma transação original.
      const entrada = await prisma.$transaction(
        async (tx) => {
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

      return NextResponse.json(
        {
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
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ======================================
    // 9. BUSCAR INGRESSO INDIVIDUAL
    // ======================================

    const ingressoIndividual =
      await prisma.ingressoConvidado.findUnique({
        where: {
          qrToken,
        },
        select: {
          id: true,
          codigo: true,
          categoria: true,
          status: true,
        },
      });

    if (!ingressoIndividual) {
      return respostaErro(
        "Ingresso não encontrado.",
        404
      );
    }

    // ======================================
    // 10. VERIFICAR STATUS INDIVIDUAL
    // ======================================

    if (ingressoIndividual.status === "UTILIZADO") {
      return respostaErro(
        "INGRESSO JÁ UTILIZADO",
        409
      );
    }

    if (ingressoIndividual.status === "CANCELADO") {
      return respostaErro(
        "INGRESSO CANCELADO",
        409
      );
    }

    // ======================================
    // 11. TRANSAÇÃO ATÔMICA INDIVIDUAL
    // ======================================

    const entradaIndividual = await prisma.$transaction(
      async (tx) => {
        // Apenas um funcionário consegue mudar
        // o status de DISPONIVEL para UTILIZADO.
        const resultado =
          await tx.ingressoConvidado.updateMany({
            where: {
              id: ingressoIndividual.id,
              status: "DISPONIVEL",
            },
            data: {
              status: "UTILIZADO",
            },
          });

        if (resultado.count !== 1) {
          throw new IngressoIndisponivelError();
        }

        // Cada ingresso individual possui
        // apenas um registro de entrada.
        // O banco também protege essa regra
        // através do campo @unique.
        return tx.entradaConvidado.create({
          data: {
            nome: nomeLimpo,
            sobrenome: sobrenomeLimpo,
            ingressoConvidadoId: ingressoIndividual.id,
            usuarioId: usuario.id,
            funcionarioNumero,
          },
        });
      }
    );

    // ======================================
    // 12. CONFIRMAÇÃO INDIVIDUAL
    // ======================================

    const nomeCategoria =
      ingressoIndividual.categoria === "PRESIDENCIA"
        ? "Presidência"
        : "Pista";

    return NextResponse.json(
      {
        sucesso: true,
        tipo: "INDIVIDUAL",
        mensagem: "ENTRADA CONFIRMADA COM SUCESSO!",
        ingresso: {
          codigo: ingressoIndividual.codigo,
          categoria: ingressoIndividual.categoria,
          nomeCategoria,
        },
        entrada: {
          id: entradaIndividual.id,
          nome: entradaIndividual.nome,
          sobrenome: entradaIndividual.sobrenome,
          funcionarioNumero:
            entradaIndividual.funcionarioNumero,
          horario: entradaIndividual.horario,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // ======================================
    // 13. CONFLITO ENTRE FUNCIONÁRIOS
    // ======================================

    if (error instanceof IngressoIndisponivelError) {
      return respostaErro(
        "Este ingresso já foi utilizado ou está indisponível.",
        409
      );
    }

    // ======================================
    // 14. ERRO INTERNO
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
