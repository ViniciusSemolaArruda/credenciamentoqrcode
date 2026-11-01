
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

// ID da União da Ilha do Governador no Neon.
const ESCOLA_ID = "cmvv2o177008rlov0yqjtq8xp";

function respostaErro(mensagem: string, status: number) {
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

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // 1. RECEBER OS DADOS
    // ==========================================

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return respostaErro("Dados inválidos.", 400);
    }

    const { numero, nomeCompleto, email } = body;

    // ==========================================
    // 2. VALIDAR O NÚMERO
    // ==========================================

    if (
      typeof numero !== "number" ||
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > 20
    ) {
      return respostaErro(
        "Número do ingresso inválido.",
        400
      );
    }

    // ==========================================
    // 3. VALIDAR NOME E E-MAIL
    // ==========================================

    if (
      typeof nomeCompleto !== "string" ||
      typeof email !== "string"
    ) {
      return respostaErro(
        "Preencha nome completo e e-mail.",
        400
      );
    }

    const nome = nomeCompleto
      .trim()
      .replace(/\s+/g, " ");

    const emailNormalizado = email
      .trim()
      .toLowerCase();

    if (
      nome.length < 3 ||
      nome.length > 150 ||
      nome.split(" ").length < 2
    ) {
      return respostaErro(
        "Informe seu nome completo.",
        400
      );
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        emailNormalizado
      );

    if (
      !emailValido ||
      emailNormalizado.length > 254
    ) {
      return respostaErro(
        "Informe um e-mail válido.",
        400
      );
    }

    // ==========================================
    // 4. VERIFICAR A ESCOLA
    // ==========================================

    const escola = await prisma.escola.findUnique({
      where: {
        id: ESCOLA_ID,
      },
      select: {
        id: true,
        nome: true,
        ativa: true,
        limite: true,
      },
    });

    if (!escola) {
      return respostaErro(
        "Escola não encontrada.",
        404
      );
    }

    const nomeEscolaNormalizado = escola.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (
      !nomeEscolaNormalizado.includes(
        "uniao da ilha"
      )
    ) {
      return respostaErro(
        "O ID configurado não corresponde à União da Ilha.",
        409
      );
    }

    if (!escola.ativa) {
      return respostaErro(
        "A retirada de ingressos está indisponível.",
        403
      );
    }

    // ==========================================
    // 5. BUSCAR O INGRESSO ORIGINAL
    // ==========================================

    const ingresso = await prisma.ingresso.findUnique({
      where: {
        escolaId_numero: {
          escolaId: ESCOLA_ID,
          numero,
        },
      },
      select: {
        id: true,
        numero: true,
        codigo: true,
        qrToken: true,
        status: true,
        retirada: {
          select: {
            id: true,
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

    // ==========================================
    // 6. VERIFICAR DISPONIBILIDADE
    // ==========================================

    if (ingresso.status !== "DISPONIVEL") {
      return respostaErro(
        "Este ingresso não está disponível.",
        409
      );
    }

    if (ingresso.retirada !== null) {
      return respostaErro(
        "Este ingresso já foi retirado. Escolha outro número.",
        409
      );
    }

    // ==========================================
    // 7. PREPARAR QR CODE ORIGINAL
    // ==========================================

    // Utiliza o qrToken original do banco.
    // Nenhum ingresso ou token novo é criado.

    const qrCode = await QRCode.toDataURL(
      ingresso.qrToken,
      {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }
    );

    // ==========================================
    // 8. REGISTRAR RETIRADA NO NEON
    // ==========================================

    // ingressoId possui restrição UNIQUE.
    //
    // Se duas pessoas tentarem retirar o
    // mesmo ingresso simultaneamente,
    // somente uma inserção será confirmada.
    //
    // A outra receberá erro P2002.

    const retirada = await prisma.retiradaIngresso.create({
      data: {
        ingressoId: ingresso.id,
        nomeCompleto: nome,
        email: emailNormalizado,
      },
      select: {
        id: true,
        retiradoEm: true,
      },
    });

    // ==========================================
    // 9. RETORNAR QR CODE AO PARTICIPANTE
    // ==========================================

    // Não alterar ingresso.status.
    // Ele continua DISPONIVEL para
    // permitir o credenciamento na entrada.

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Ingresso retirado com sucesso!",
        retirada: {
          id: retirada.id,
          retiradoEm: retirada.retiradoEm,
        },
        participante: {
          nomeCompleto: nome,
          email: emailNormalizado,
        },
        ingresso: {
          numero: ingresso.numero,
          codigo: ingresso.codigo,
          qrCode,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    // ==========================================
    // 10. TRATAR CONCORRÊNCIA
    // ==========================================

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return respostaErro(
        "Este ingresso acabou de ser retirado por outra pessoa. Escolha outro número.",
        409
      );
    }

    console.error(
      "Erro ao retirar ingresso da União da Ilha:",
      error
    );

    return respostaErro(
      "Não foi possível concluir a retirada. Tente novamente.",
      500
    );
  }
}
