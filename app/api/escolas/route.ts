
import { NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  await connection();

  try {
    // ==========================================
    // 1. VERIFICAR AUTENTICAÇÃO
    // ==========================================

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Faça login para continuar.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. VERIFICAR PERMISSÃO DO GERENTE
    // ==========================================

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Acesso permitido somente ao gerente.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 3. VERIFICAR USUÁRIO NO BANCO
    // ==========================================

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
      usuario.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Usuário sem autorização.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 4. BUSCAR ESCOLAS DE SAMBA
    // ==========================================

    const escolas = await prisma.escola.findMany({
      orderBy: {
        nome: "asc",
      },
      include: {
        _count: {
          select: {
            ingressos: true,
          },
        },
        ingressos: {
          select: {
            status: true,
          },
        },
      },
    });

    // ==========================================
    // 5. CALCULAR STATUS DOS INGRESSOS
    // ==========================================

    const resultado = escolas.map((escola) => {
      const utilizados = escola.ingressos.filter(
        (ingresso) => ingresso.status === "UTILIZADO"
      ).length;

      const disponiveis = escola.ingressos.filter(
        (ingresso) => ingresso.status === "DISPONIVEL"
      ).length;

      const cancelados = escola.ingressos.filter(
        (ingresso) => ingresso.status === "CANCELADO"
      ).length;

      return {
        id: escola.id,
        nome: escola.nome,
        sigla: escola.sigla,
        limite: escola.limite,
        ativa: escola.ativa,
        totalIngressos: escola._count.ingressos,
        utilizados,
        disponiveis,
        cancelados,
      };
    });

    // ==========================================
    // 6. RETORNAR RESULTADO
    // ==========================================

    return NextResponse.json({
      sucesso: true,
      totalEscolas: resultado.length,
      escolas: resultado,
    });
  } catch (error) {
    console.error("Erro ao buscar escolas:", error);

    return NextResponse.json(
      {
        sucesso: false,
        mensagem: "Erro interno ao buscar escolas.",
      },
      { status: 500 }
    );
  }
}
