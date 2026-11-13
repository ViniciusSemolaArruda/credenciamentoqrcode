
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { CategoriaConvidado } from "@/app/generated/prisma/client";

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
// NOMES DAS CATEGORIAS INDIVIDUAIS
// ==========================================

function nomeCategoria(
  categoria: CategoriaConvidado
): string {
  switch (categoria) {
    case "PRESIDENCIA":
      return "Presidência";

    case "PISTA":
      return "Pista";

    case "CONVIDADOS_SANDRO":
      return "Convidados Sandro";

    case "CONVIDADOS_ALBERTO":
      return "Convidados Alberto";

    case "CORTE_RIO_CARNAVAL_2026":
      return "Corte do Rio Carnaval 2026";

    default:
      return "Convidado";
  }
}

// ==========================================
// VALIDAR QR CODE
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
    // 2. VERIFICAR USUÁRIO
    // ======================================

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
      return respostaErro("Acesso negado.", 403);
    }

    // ======================================
    // 3. VALIDAR REQUISIÇÃO
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

    const { qrToken } = body;

    if (
      typeof qrToken !== "string" ||
      !/^[a-f0-9]{64}$/i.test(qrToken)
    ) {
      return respostaErro("QR Code inválido.", 400);
    }

    // ======================================
    // 4. BUSCAR INGRESSO DE ESCOLA
    // ======================================

    const ingresso = await prisma.ingresso.findUnique({
      where: {
        qrToken,
      },
      select: {
        id: true,
        codigo: true,
        status: true,
        escola: {
          select: {
            nome: true,
            ativa: true,
          },
        },
        entradas: {
          orderBy: [
            { horario: "desc" },
            { id: "desc" },
          ],
          take: 1,
          select: {
            nome: true,
            sobrenome: true,
            horario: true,
          },
        },
      },
    });

    if (ingresso) {
      const ultimaEntrada =
        ingresso.status === "UTILIZADO"
          ? ingresso.entradas[0] ?? null
          : null;

      return respostaSucesso({
        tipo: "ESCOLA",
        status: ingresso.status,
        ingresso: {
          id: ingresso.id,
          codigo: ingresso.codigo,
          status: ingresso.status,
          tipo: "ESCOLA",
          categoria: null,
          escola: {
            nome: ingresso.escola.nome,
          },
          ultimaEntrada: ultimaEntrada
            ? {
                nome: ultimaEntrada.nome,
                sobrenome: ultimaEntrada.sobrenome,
                horario:
                  ultimaEntrada.horario.toISOString(),
              }
            : null,
        },
      });
    }

    // ======================================
    // 5. BUSCAR INGRESSO INDIVIDUAL
    // PRESIDÊNCIA, PISTA, SANDRO, ALBERTO
    // E CORTE DO RIO CARNAVAL 2026
    // ======================================

    const ingressoIndividual =
      await prisma.ingressoConvidado.findUnique({
        where: {
          qrToken,
        },
        select: {
          id: true,
          codigo: true,
          numero: true,
          categoria: true,
          status: true,

          // Dados personalizados da Corte
          nomeTitular: true,
          cargo: true,
          tipoAcesso: true,

          entrada: {
            select: {
              nome: true,
              sobrenome: true,
              horario: true,
            },
          },
        },
      });

    if (ingressoIndividual) {
      const nomeCategoriaIngresso = nomeCategoria(
        ingressoIndividual.categoria
      );

      const ehCorte =
        ingressoIndividual.categoria ===
        "CORTE_RIO_CARNAVAL_2026";

      const ultimaEntradaIndividual =
        ingressoIndividual.status === "UTILIZADO"
          ? ingressoIndividual.entrada
          : null;

      return respostaSucesso({
        tipo: "INDIVIDUAL",
        status: ingressoIndividual.status,

        ingresso: {
          id: ingressoIndividual.id,
          codigo: ingressoIndividual.codigo,
          numero: ingressoIndividual.numero,
          status: ingressoIndividual.status,

          tipo: "INDIVIDUAL",
          categoria: ingressoIndividual.categoria,
          nomeCategoria: nomeCategoriaIngresso,

          // Personalização exclusiva da Corte
          nomeTitular: ehCorte
            ? ingressoIndividual.nomeTitular
            : null,

          cargo: ehCorte
            ? ingressoIndividual.cargo
            : null,

          tipoAcesso: ehCorte
            ? ingressoIndividual.tipoAcesso ?? "CAMAROTE"
            : null,

          // Compatibilidade com o leitor atual
          escola: {
            nome: nomeCategoriaIngresso,
          },

          // Ingressos individuais são de uso único
          permiteAcompanhantes: false,

          ultimaEntrada: ultimaEntradaIndividual
            ? {
                nome: ultimaEntradaIndividual.nome,
                sobrenome:
                  ultimaEntradaIndividual.sobrenome,
                horario:
                  ultimaEntradaIndividual.horario.toISOString(),
              }
            : null,
        },
      });
    }

    // ======================================
    // 6. BUSCAR INGRESSO DA IMPRENSA
    // ======================================

    const ingressoImprensa =
      await prisma.ingressoImprensa.findUnique({
        where: {
          qrToken,
        },
        select: {
          id: true,
          codigo: true,
          numero: true,
          status: true,
          veiculo: {
            select: {
              id: true,
              nome: true,
              slug: true,
              ativo: true,
            },
          },
          entrada: {
            select: {
              nome: true,
              sobrenome: true,
              horario: true,
            },
          },
        },
      });

    if (!ingressoImprensa) {
      return respostaErro(
        "Ingresso não encontrado.",
        404
      );
    }

    // ======================================
    // 7. VERIFICAR VEÍCULO DE IMPRENSA
    // ======================================

    if (!ingressoImprensa.veiculo.ativo) {
      return respostaErro(
        "VEÍCULO DE IMPRENSA INATIVO",
        409
      );
    }

    // ======================================
    // 8. RETORNAR INGRESSO DA IMPRENSA
    // ======================================

    const nomeVeiculo = ingressoImprensa.veiculo.nome;

    const ultimaEntradaImprensa =
      ingressoImprensa.status === "UTILIZADO"
        ? ingressoImprensa.entrada
        : null;

    return respostaSucesso({
      tipo: "IMPRENSA",
      status: ingressoImprensa.status,

      ingresso: {
        id: ingressoImprensa.id,
        codigo: ingressoImprensa.codigo,
        numero: ingressoImprensa.numero,
        status: ingressoImprensa.status,

        tipo: "IMPRENSA",
        categoria: "IMPRENSA",
        nomeCategoria: nomeVeiculo,

        // Compatibilidade com o leitor atual
        escola: {
          nome: nomeVeiculo,
        },

        veiculo: {
          id: ingressoImprensa.veiculo.id,
          nome: nomeVeiculo,
          slug: ingressoImprensa.veiculo.slug,
          ativo: ingressoImprensa.veiculo.ativo,
        },

        permiteAcompanhantes: false,

        ultimaEntrada: ultimaEntradaImprensa
          ? {
              nome: ultimaEntradaImprensa.nome,
              sobrenome: ultimaEntradaImprensa.sobrenome,
              horario:
                ultimaEntradaImprensa.horario.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Erro ao validar ingresso:", error);

    return respostaErro(
      "Erro interno ao validar ingresso.",
      500
    );
  }
}
