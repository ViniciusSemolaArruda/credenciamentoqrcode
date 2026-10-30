
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const CONTROLE_PIN_ID = "PIN_GERENCIAL_GLOBAL";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Faça login novamente.",
        },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Apenas o administrador pode desbloquear o PIN.",
        },
        { status: 403 }
      );
    }

    const administrador =
      await prisma.usuario.findUnique({
        where: {
          id: session.id,
        },
        select: {
          ativo: true,
          role: true,
        },
      });

    if (
      !administrador?.ativo ||
      administrador.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Administrador não autorizado.",
        },
        { status: 403 }
      );
    }

    // Reinicia somente o controle de bloqueio.
    // Não altera ingressos e não apaga tentativas.
    await prisma.controlePinGerente.upsert({
      where: {
        id: CONTROLE_PIN_ID,
      },
      create: {
        id: CONTROLE_PIN_ID,
        tentativas: 0,
        bloqueadoAte: null,
      },
      update: {
        tentativas: 0,
        bloqueadoAte: null,
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem:
        "PIN desbloqueado com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao desbloquear PIN:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        mensagem:
          "Erro interno ao desbloquear o PIN.",
      },
      { status: 500 }
    );
  }
}
