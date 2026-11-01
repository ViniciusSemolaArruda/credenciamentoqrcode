
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import QRCode from "qrcode";

type Contexto = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: Contexto
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { mensagem: "Não autenticado." },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.id },
      select: {
        role: true,
        ativo: true,
      },
    });

    if (!usuario?.ativo || usuario.role !== "ADMIN") {
      return NextResponse.json(
        { mensagem: "Acesso negado." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const retirada = await prisma.retiradaIngresso.findUnique({
      where: { id },
      select: {
        ingresso: {
          select: {
            numero: true,
            codigo: true,
            qrToken: true,
          },
        },
      },
    });

    if (!retirada) {
      return NextResponse.json(
        { mensagem: "Retirada não encontrada." },
        { status: 404 }
      );
    }

    const png = await QRCode.toBuffer(
      retirada.ingresso.qrToken,
      {
        type: "png",
        width: 640,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }
    );

    const nomeArquivo = `ingresso-${retirada.ingresso.numero}.png`;

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao baixar QR Code:", error);

    return NextResponse.json(
      { mensagem: "Erro ao gerar QR Code." },
      { status: 500 }
    );
  }
}
