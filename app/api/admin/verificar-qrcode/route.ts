
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // 1. VERIFICAR SESSÃO DO GERENTE
    // ==========================================

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Sessão expirada. Faça login novamente.",
        },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Acesso exclusivo do gerente.",
        },
        { status: 403 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.id },
      select: {
        ativo: true,
        role: true,
      },
    });

    if (!usuario?.ativo || usuario.role !== "ADMIN") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Gerente não autorizado.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 2. VALIDAR QR CODE
    // ==========================================

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Dados inválidos.",
        },
        { status: 400 }
      );
    }

    const { qrToken } = body;

    if (
      typeof qrToken !== "string" ||
      !/^[a-f0-9]{64}$/i.test(qrToken)
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "QR Code inválido.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. PROCURAR NAS ESCOLAS DE SAMBA
    // ==========================================

    const ingresso = await prisma.ingresso.findUnique({
      where: { qrToken },
      select: {
        id: true,
        codigo: true,
        numero: true,
        status: true,
        escola: {
          select: {
            nome: true,
            sigla: true,
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
            funcionarioNumero: true,
          },
        },
      },
    });

    if (ingresso) {
      return NextResponse.json(
        {
          sucesso: true,
          reconhecido: true,
          tipo: "ESCOLA",
          ingresso: {
            id: ingresso.id,
            codigo: ingresso.codigo,
            numero: ingresso.numero,
            status: ingresso.status,
            escola: ingresso.escola,
            ultimaEntrada: ingresso.entradas[0] ?? null,
          },
        },
        {
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    // ==========================================
    // 4. PROCURAR PRESIDÊNCIA E PISTA
    // ==========================================

    const convidado = await prisma.ingressoConvidado.findUnique({
      where: { qrToken },
      select: {
        id: true,
        codigo: true,
        numero: true,
        categoria: true,
        status: true,
        entrada: {
          select: {
            nome: true,
            sobrenome: true,
            horario: true,
            funcionarioNumero: true,
          },
        },
      },
    });

    if (convidado) {
      return NextResponse.json(
        {
          sucesso: true,
          reconhecido: true,
          tipo: "CONVIDADO",
          categoria: convidado.categoria,
          ingresso: {
            id: convidado.id,
            codigo: convidado.codigo,
            numero: convidado.numero,
            categoria: convidado.categoria,
            status: convidado.status,
            ultimaEntrada: convidado.entrada ?? null,
          },
        },
        {
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    // ==========================================
    // 5. QR CODE DESCONHECIDO
    // ==========================================

    return NextResponse.json(
      {
        sucesso: true,
        reconhecido: false,
        mensagem: "QR Code não pertence ao sistema.",
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Erro ao verificar QR Code:", error);

    return NextResponse.json(
      {
        sucesso: false,
        mensagem: "Erro interno ao verificar QR Code.",
      },
      { status: 500 }
    );
  }
}
