import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ==========================================
// RESPOSTA PADRONIZADA DE ERRO
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
    // 2. VERIFICAR USUÁRIO NO BANCO
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

    if (
      !usuario ||
      !usuario.ativo ||
      usuario.role !== "FUNCIONARIO"
    ) {
      return respostaErro("Acesso negado.", 403);
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

    const { qrToken } = body;

    // ======================================
    // 4. VALIDAR TOKEN DO QR CODE
    // ======================================

    if (
      typeof qrToken !== "string" ||
      !/^[a-f0-9]{64}$/i.test(qrToken)
    ) {
      return respostaErro("QR Code inválido.", 400);
    }

    // ======================================
    // 5. BUSCAR INGRESSO NO POSTGRESQL
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

    if (!ingresso) {
      return respostaErro(
        "Ingresso não encontrado.",
        404
      );
    }

    // ======================================
    // 6. IDENTIFICAR ÚLTIMO PARTICIPANTE
    // ======================================

    const ultimaEntrada =
      ingresso.status === "UTILIZADO"
        ? ingresso.entradas[0] ?? null
        : null;

    // ======================================
    // 7. RETORNAR RESULTADO
    // ======================================

    return NextResponse.json(
      {
        sucesso: true,
        status: ingresso.status,
        ingresso: {
          id: ingresso.id,
          codigo: ingresso.codigo,
          status: ingresso.status,
          escola: {
            nome: ingresso.escola.nome,
          },
          ultimaEntrada: ultimaEntrada
            ? {
                nome: ultimaEntrada.nome,
                sobrenome: ultimaEntrada.sobrenome,
                horario: ultimaEntrada.horario.toISOString(),
              }
            : null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao validar ingresso:",
      error
    );

    return respostaErro(
      "Erro interno ao validar ingresso.",
      500
    );
  }
}