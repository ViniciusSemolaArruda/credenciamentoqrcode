
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// CONFIGURAÇÃO DA UNIÃO DA ILHA
// ==========================================

const ESCOLA_ID = "cmvv2o177008rlov0yqjtq8xp";

// ==========================================
// CONSULTAR INGRESSOS DISPONÍVEIS
// ==========================================

export async function GET() {
  try {
    // Buscar a escola específica
    const escola = await prisma.escola.findUnique({
      where: {
        id: ESCOLA_ID,
      },
      select: {
        id: true,
        nome: true,
        ativa: true,
        limite: true,
        ingressos: {
          orderBy: {
            numero: "asc",
          },
          select: {
            numero: true,
            status: true,
            retirada: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Verificar se a escola existe
    if (!escola) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Escola não encontrada.",
        },
        { status: 404 }
      );
    }

    // Impedir associação com outra escola
    const nomeNormalizado = escola.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (
      !nomeNormalizado.includes("uniao da ilha")
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "O ID configurado não corresponde à União da Ilha.",
        },
        { status: 409 }
      );
    }

    // Verificar se a escola está ativa
    if (!escola.ativa) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "A retirada de ingressos está indisponível.",
        },
        { status: 403 }
      );
    }

    // Preparar os ingressos para a cartela
    const ingressos = escola.ingressos.map(
      (ingresso) => {
        const retirado = ingresso.retirada !== null;

        const disponivel =
          ingresso.status === "DISPONIVEL" &&
          !retirado;

        return {
          numero: ingresso.numero,
          disponivel,
          retirado,
          utilizado:
            ingresso.status === "UTILIZADO",
          cancelado:
            ingresso.status === "CANCELADO",
        };
      }
    );

    const disponiveis = ingressos.filter(
      (ingresso) => ingresso.disponivel
    ).length;

    return NextResponse.json(
      {
        sucesso: true,
        escola: {
          id: escola.id,
          nome: escola.nome,
          limite: escola.limite,
        },
        estatisticas: {
          total: ingressos.length,
          disponiveis,
          indisponiveis:
            ingressos.length - disponiveis,
        },
        ingressos,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao consultar ingressos da União da Ilha:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        mensagem:
          "Erro interno ao consultar ingressos.",
      },
      { status: 500 }
    );
  }
}
