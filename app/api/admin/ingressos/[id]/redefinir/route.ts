
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // ==========================================
    // 1. VERIFICAR AUTENTICAÇÃO
    // ==========================================

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          erro: "Você precisa estar autenticado.",
        },
        { status: 401 }
      );
    }

    // Apenas administradores podem redefinir.
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          erro: "Acesso permitido apenas ao administrador.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 2. IDENTIFICAR O INGRESSO
    // ==========================================

    const { id } = await params;

    const ingresso = await prisma.ingresso.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        codigo: true,
        status: true,
      },
    });

    if (!ingresso) {
      return NextResponse.json(
        {
          erro: "Ingresso não encontrado.",
        },
        { status: 404 }
      );
    }

    if (ingresso.status !== "UTILIZADO") {
      return NextResponse.json(
        {
          erro: "Apenas ingressos utilizados podem ser redefinidos.",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // 3. VALIDAR JUSTIFICATIVA
    // ==========================================

    const body = await request.json().catch(() => null);

    const motivo =
      typeof body?.motivo === "string"
        ? body.motivo.trim()
        : "";

    if (motivo.length < 5 || motivo.length > 500) {
      return NextResponse.json(
        {
          erro: "Informe um motivo entre 5 e 500 caracteres.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. ATUALIZAR STATUS
    // ==========================================

    // updateMany garante que apenas um ingresso
    // ainda UTILIZADO possa ser redefinido.
    const resultado = await prisma.ingresso.updateMany({
      where: {
        id,
        status: "UTILIZADO",
      },
      data: {
        status: "DISPONIVEL",
      },
    });

    if (resultado.count !== 1) {
      return NextResponse.json(
        {
          erro: "O status do ingresso mudou. Atualize a página.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "Ingresso disponível novamente.",
      ingresso: {
        id: ingresso.id,
        codigo: ingresso.codigo,
        status: "DISPONIVEL",
      },
    });
  } catch (error) {
    console.error("Erro ao redefinir ingresso:", error);

    return NextResponse.json(
      {
        erro: "Não foi possível redefinir o ingresso.",
      },
      { status: 500 }
    );
  }
}
