
import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import QRCode from "qrcode";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

async function main() {
  const ingressos =
    await prisma.ingressoConvidado.findMany({
      orderBy: [
        { categoria: "asc" },
        { numero: "asc" },
      ],
      select: {
        codigo: true,
        numero: true,
        categoria: true,
        qrToken: true,
      },
    });

  if (ingressos.length !== 30) {
    throw new Error(
      `Esperados 30 ingressos, encontrados ${ingressos.length}.`
    );
  }

  const pastaBase = path.join(
    process.cwd(),
    "qrcodes-individuais"
  );

  for (const categoria of ["PRESIDENCIA", "PISTA"]) {
    const quantidade = ingressos.filter(
      (ingresso) => ingresso.categoria === categoria
    ).length;

    if (quantidade !== 15) {
      throw new Error(
        `${categoria}: esperados 15 ingressos, encontrados ${quantidade}.`
      );
    }
  }

  for (const ingresso of ingressos) {
    const pastaCategoria = path.join(
      pastaBase,
      ingresso.categoria
    );

    await fs.mkdir(pastaCategoria, {
      recursive: true,
    });

    const arquivo = path.join(
      pastaCategoria,
      `${ingresso.codigo}.png`
    );

    await QRCode.toFile(
      arquivo,
      ingresso.qrToken,
      {
        type: "png",
        width: 900,
        margin: 3,
        errorCorrectionLevel: "H",
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }
    );

    console.log(`[GERADO] ${ingresso.codigo}.png`);
  }

  console.log("\n================================");
  console.log("30 QR CODES GERADOS COM SUCESSO!");
  console.log("================================");
  console.log(`Pasta: ${pastaBase}`);
}

main()
  .catch((error) => {
    console.error("Erro:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
