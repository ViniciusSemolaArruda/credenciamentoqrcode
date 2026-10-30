
import { NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  await connection();

  try {
    // ======================================
    // 1. VERIFICAR SESSÃO JWT
    // ======================================

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          autenticado: false,
          usuario: null,
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ======================================
    // 2. CONSULTAR USUÁRIO NO BANCO
    // ======================================

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        nome: true,
        role: true,
        ativo: true,
      },
    });

    // ======================================
    // 3. VERIFICAR PERMISSÕES
    // ======================================

    if (
      !usuario ||
      !usuario.ativo ||
      usuario.role !== session.role
    ) {
      return NextResponse.json(
        {
          autenticado: false,
          usuario: null,
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ======================================
    // 4. RETORNAR USUÁRIO AUTENTICADO
    // ======================================

    return NextResponse.json(
      {
        autenticado: true,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          role: usuario.role,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);

    return NextResponse.json(
      {
        autenticado: false,
        usuario: null,
        mensagem: "Erro ao verificar sessão.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
