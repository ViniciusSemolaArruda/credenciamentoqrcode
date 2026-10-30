
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { verificarPinGerente } from "@/lib/seguranca-pin";

class IngressoNaoUtilizadoError extends Error {}

export async function POST(request: NextRequest) {
  try {
    // ======================================
    // 1. VERIFICAR SESSÃO
    // ======================================

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

    if (session.role !== "FUNCIONARIO") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Operação disponível apenas no credenciamento.",
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

    if (
      !usuario?.ativo ||
      usuario.role !== "FUNCIONARIO"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Acesso não autorizado.",
        },
        { status: 403 }
      );
    }

    // ======================================
    // 2. VALIDAR DADOS
    // ======================================

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Dados inválidos.",
        },
        { status: 400 }
      );
    }

    const {
      qrToken,
      funcionarioNumero,
      motivo,
      pinGerente,
    } = body;

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

    if (
      !Number.isInteger(funcionarioNumero) ||
      ![1, 2, 3].includes(funcionarioNumero)
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Funcionário inválido.",
        },
        { status: 400 }
      );
    }

    if (
      typeof motivo !== "string" ||
      motivo.trim().length < 5 ||
      motivo.trim().length > 500
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Informe um motivo de 5 a 500 caracteres.",
        },
        { status: 400 }
      );
    }

    // ======================================
    // 3. VERIFICAR CONFIGURAÇÃO DO PIN
    // ======================================

    if (!process.env.GERENTE_PIN_HASH) {
      console.error(
        "GERENTE_PIN_HASH não configurado."
      );

      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Autorização gerencial indisponível.",
        },
        { status: 503 }
      );
    }

    // ======================================
    // 4. IDENTIFICAR GERENTE ATIVO
    // ======================================

    const gerente = await prisma.usuario.findUnique({
      where: {
        email: "gerente@credenciamento.local",
      },
      select: {
        id: true,
        ativo: true,
        role: true,
      },
    });

    if (
      !gerente ||
      !gerente.ativo ||
      gerente.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Gerente não autorizado.",
        },
        { status: 403 }
      );
    }

    // ======================================
    // 5. LOCALIZAR INGRESSO
    // ======================================

    const ingresso = await prisma.ingresso.findUnique({
      where: { qrToken },
      select: {
        id: true,
        status: true,
      },
    });

    if (!ingresso) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Ingresso não encontrado.",
        },
        { status: 404 }
      );
    }

    if (ingresso.status !== "UTILIZADO") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Somente ingressos utilizados podem ser liberados.",
        },
        { status: 409 }
      );
    }

    // ======================================
    // 6. VALIDAR PIN COM LIMITE DE TENTATIVAS
    // ======================================

    const resultadoPin = await verificarPinGerente({
      pin:
        typeof pinGerente === "string" &&
        /^\d{8}$/.test(pinGerente)
          ? pinGerente
          : "",
      funcionarioId: session.id,
      funcionarioNumero,
      ingressoId: ingresso.id,
    });

    if (resultadoPin.bloqueado) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "PIN gerencial temporariamente bloqueado. Aguarde 15 minutos.",
          bloqueado: true,
          bloqueadoAte: resultadoPin.bloqueadoAte,
          tentativasRestantes: 0,
        },
        { status: 429 }
      );
    }

    if (!resultadoPin.autorizado) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Autorização gerencial inválida.",
          tentativasRestantes:
            resultadoPin.tentativasRestantes,
        },
        { status: 403 }
      );
    }

    // ======================================
    // 7. LIBERAR INGRESSO E REGISTRAR HISTÓRICO
    // ======================================

    const liberacao = await prisma.$transaction(
      async (tx) => {
        // Impedir duas liberações simultâneas.
        const resultado = await tx.ingresso.updateMany({
          where: {
            id: ingresso.id,
            status: "UTILIZADO",
          },
          data: {
            status: "DISPONIVEL",
          },
        });

        if (resultado.count !== 1) {
          throw new IngressoNaoUtilizadoError();
        }

        const entradaAnterior = await tx.entrada.findFirst({
          where: {
            ingressoId: ingresso.id,
          },
          orderBy: [
            { horario: "desc" },
            { id: "desc" },
          ],
          select: {
            id: true,
          },
        });

        return tx.liberacaoIngresso.create({
          data: {
            ingressoId: ingresso.id,
            gerenteId: gerente.id,
            funcionarioNumero,
            motivo: motivo.trim(),
            entradaAnteriorId:
              entradaAnterior?.id ?? null,
          },
        });
      }
    );

    // ======================================
    // 8. RESPOSTA DE SUCESSO
    // ======================================

    return NextResponse.json({
      sucesso: true,
      mensagem: "INGRESSO LIBERADO COM SUCESSO!",
      liberacao: {
        id: liberacao.id,
        funcionarioNumero:
          liberacao.funcionarioNumero,
        autorizadoEm: liberacao.autorizadoEm,
      },
    });
  } catch (error) {
    if (error instanceof IngressoNaoUtilizadoError) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Este ingresso já foi liberado.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Erro ao liberar ingresso:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        mensagem:
          "Erro interno ao liberar ingresso.",
      },
      { status: 500 }
    );
  }
}
