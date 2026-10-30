
import "server-only";

import bcrypt from "bcryptjs";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;
const CONTROLE_ID = "PIN_GERENCIAL_GLOBAL";

type ResultadoPin = {
  autorizado: boolean;
  bloqueado: boolean;
  tentativasRestantes: number;
  bloqueadoAte: string | null;
};

type VerificarPinParams = {
  pin: string;
  funcionarioId: string;
  funcionarioNumero: number;
  ingressoId: string | null;
};

export async function verificarPinGerente({
  pin,
  funcionarioId,
  funcionarioNumero,
  ingressoId,
}: VerificarPinParams): Promise<ResultadoPin> {
  const pinHash = process.env.GERENTE_PIN_HASH;

  if (!pinHash) {
    throw new Error("GERENTE_PIN_HASH não configurado.");
  }

  // Criar o controle global, se ainda não existir.
  await prisma.controlePinGerente.upsert({
    where: { id: CONTROLE_ID },
    create: { id: CONTROLE_ID },
    update: {},
  });

  return prisma.$transaction(
    async (tx) => {
      // Bloquear a linha até finalizar a transação.
      // Isso serializa tentativas simultâneas.
      await tx.$queryRaw`
        SELECT id
        FROM "ControlePinGerente"
        WHERE id = ${CONTROLE_ID}
        FOR UPDATE
      `;

      const controle = await tx.controlePinGerente.findUniqueOrThrow({
        where: { id: CONTROLE_ID },
      });

      const agora = new Date();

      // Bloqueio ainda ativo.
      if (
        controle.bloqueadoAte &&
        controle.bloqueadoAte > agora
      ) {
        await tx.tentativaPinGerente.create({
          data: {
            funcionarioId,
            funcionarioNumero,
            ingressoId,
            resultado: "BLOQUEADO",
          },
        });

        return {
          autorizado: false,
          bloqueado: true,
          tentativasRestantes: 0,
          bloqueadoAte: controle.bloqueadoAte.toISOString(),
        };
      }

      // Se o bloqueio expirou, reiniciar contagem.
      const tentativasAtuais =
        controle.bloqueadoAte &&
        controle.bloqueadoAte <= agora
          ? 0
          : controle.tentativas;

      const pinValido = await bcrypt.compare(pin, pinHash);

      if (pinValido) {
        await tx.controlePinGerente.update({
          where: { id: CONTROLE_ID },
          data: {
            tentativas: 0,
            bloqueadoAte: null,
          },
        });

        await tx.tentativaPinGerente.create({
          data: {
            funcionarioId,
            funcionarioNumero,
            ingressoId,
            resultado: "CORRETO",
          },
        });

        return {
          autorizado: true,
          bloqueado: false,
          tentativasRestantes: MAX_TENTATIVAS,
          bloqueadoAte: null,
        };
      }

      const novasTentativas = tentativasAtuais + 1;
      const deveBloquear = novasTentativas >= MAX_TENTATIVAS;

      const bloqueadoAte = deveBloquear
        ? new Date(
            agora.getTime() +
              BLOQUEIO_MINUTOS * 60 * 1000
          )
        : null;

      await tx.controlePinGerente.update({
        where: { id: CONTROLE_ID },
        data: {
          tentativas: novasTentativas,
          bloqueadoAte,
        },
      });

      await tx.tentativaPinGerente.create({
        data: {
          funcionarioId,
          funcionarioNumero,
          ingressoId,
          resultado: deveBloquear
            ? "LIMITE_ATINGIDO"
            : "INCORRETO",
        },
      });

      return {
        autorizado: false,
        bloqueado: deveBloquear,
        tentativasRestantes: Math.max(
          0,
          MAX_TENTATIVAS - novasTentativas
        ),
        bloqueadoAte: bloqueadoAte?.toISOString() ?? null,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 10000,
      timeout: 20000,
    }
  );
}
