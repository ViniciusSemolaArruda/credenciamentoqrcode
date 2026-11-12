
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// ==========================================
// ERRO DE CONCORRÊNCIA
// ==========================================

class IngressoIndisponivelError extends Error {}

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
    // 2. VERIFICAR USUÁRIO
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

    if (!usuario?.ativo || usuario.role !== "FUNCIONARIO") {
      return respostaErro(
        "Usuário sem autorização.",
        403
      );
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
    // 6. VALIDAR FUNCIONÁRIO
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
    // 8. CONFIRMAR INGRESSO DE ESCOLA
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

      return respostaSucesso({
        tipo: "ESCOLA",
        mensagem: "ENTRADA CONFIRMADA COM SUCESSO!",
        entrada: {
          id: entrada.id,
          nome: entrada.nome,
          sobrenome: entrada.sobrenome,
          funcionarioNumero: entrada.funcionarioNumero,
          horario: entrada.horario,
        },
      });
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

    // ======================================
    // 10. CONFIRMAR INGRESSO INDIVIDUAL
    // ======================================

    if (ingressoIndividual) {
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

      const entradaIndividual =
        await prisma.$transaction(async (tx) => {
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

          return tx.entradaConvidado.create({
            data: {
              nome: nomeLimpo,
              sobrenome: sobrenomeLimpo,
              ingressoConvidadoId: ingressoIndividual.id,
              usuarioId: usuario.id,
              funcionarioNumero,
            },
          });
        });

      const nomeCategoria =
        ingressoIndividual.categoria === "PRESIDENCIA"
          ? "Presidência"
          : "Pista";

      return respostaSucesso({
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
      });
    }

    // ======================================
    // 11. BUSCAR INGRESSO DA IMPRENSA
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
              nome: true,
              slug: true,
              ativo: true,
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
    // 12. VERIFICAR VEÍCULO ATIVO
    // ======================================

    if (!ingressoImprensa.veiculo.ativo) {
      return respostaErro(
        "VEÍCULO DE IMPRENSA INATIVO",
        409
      );
    }

    // ======================================
    // 13. VERIFICAR STATUS
    // ======================================

    if (ingressoImprensa.status === "UTILIZADO") {
      return respostaErro(
        "INGRESSO JÁ UTILIZADO",
        409
      );
    }

    if (ingressoImprensa.status === "CANCELADO") {
      return respostaErro(
        "INGRESSO CANCELADO",
        409
      );
    }

    // ======================================
    // 14. CONFIRMAR ENTRADA DA IMPRENSA
    // ======================================

    const entradaImprensa =
      await prisma.$transaction(async (tx) => {
        // Atualização condicional:
        // somente um funcionário pode utilizar
        // este ingresso.

        const resultado =
          await tx.ingressoImprensa.updateMany({
            where: {
              id: ingressoImprensa.id,
              status: "DISPONIVEL",
              veiculo: {
                ativo: true,
              },
            },
            data: {
              status: "UTILIZADO",
            },
          });

        if (resultado.count !== 1) {
          throw new IngressoIndisponivelError();
        }

        // Cada ingresso de imprensa possui
        // somente uma entrada.

        return tx.entradaImprensa.create({
          data: {
            nome: nomeLimpo,
            sobrenome: sobrenomeLimpo,
            ingressoImprensaId: ingressoImprensa.id,
            usuarioId: usuario.id,
            funcionarioNumero,
          },
        });
      });

    // ======================================
    // 15. RETORNAR CONFIRMAÇÃO
    // ======================================

    return respostaSucesso({
      tipo: "IMPRENSA",
      mensagem: "ENTRADA CONFIRMADA COM SUCESSO!",
      ingresso: {
        codigo: ingressoImprensa.codigo,
        numero: ingressoImprensa.numero,
        categoria: "IMPRENSA",
        nomeCategoria: ingressoImprensa.veiculo.nome,
        veiculo: {
          nome: ingressoImprensa.veiculo.nome,
          slug: ingressoImprensa.veiculo.slug,
        },
      },
      entrada: {
        id: entradaImprensa.id,
        nome: entradaImprensa.nome,
        sobrenome: entradaImprensa.sobrenome,
        funcionarioNumero:
          entradaImprensa.funcionarioNumero,
        horario: entradaImprensa.horario,
      },
    });
  } catch (error) {
    // ======================================
    // CONFLITO ENTRE FUNCIONÁRIOS
    // ======================================

    if (error instanceof IngressoIndisponivelError) {
      return respostaErro(
        "Este ingresso já foi utilizado ou está indisponível.",
        409
      );
    }

    // ======================================
    // ERRO INTERNO
    // ======================================

    console.error("Erro ao confirmar entrada:", error);

    return respostaErro(
      "Erro interno ao confirmar entrada.",
      500
    );
  }
}
