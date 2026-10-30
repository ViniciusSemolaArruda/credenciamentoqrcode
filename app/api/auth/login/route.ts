
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const senha =
      typeof body?.senha === "string"
        ? body.senha
        : "";

    if (
      !email ||
      !senha ||
      email.length > 254 ||
      senha.length > 1024
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "E-mail ou senha inválidos.",
        },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "E-mail ou senha inválidos.",
        },
        { status: 401 }
      );
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senhaHash
    );

    if (!senhaCorreta) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "E-mail ou senha inválidos.",
        },
        { status: 401 }
      );
    }

    await createSession({
      id: usuario.id,
      nome: usuario.nome,
      role: usuario.role,
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        role: usuario.role,
      },
    });
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return NextResponse.json(
      {
        sucesso: false,
        mensagem: "Erro interno ao realizar login.",
      },
      { status: 500 }
    );
  }
}
