
import "dotenv/config";

import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada no .env");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

// ==========================================
// CATEGORIAS A SEREM GERADAS
// ==========================================

const grupos = [
  {
    categoria: "CONVIDADOS_SANDRO" as const,
    prefixo: "SANDRO",
    quantidade: 100,
  },
  {
    categoria: "CONVIDADOS_ALBERTO" as const,
    prefixo: "ALBERTO",
    quantidade: 100,
  },
];

// ==========================================
// GERAR TOKEN EXCLUSIVO
// ==========================================

function gerarToken(): string {
  return randomBytes(32).toString("hex");
}

// ==========================================
// GERAR INGRESSOS
// ==========================================

async function main() {
  console.log("Iniciando geração dos convidados especiais...");

  let totalCriados = 0;
  let totalExistentes = 0;

  for (const grupo of grupos) {
    console.log(`\nCategoria: ${grupo.categoria}`);

    let criados = 0;
    let existentes = 0;

    for (let numero = 1; numero <= grupo.quantidade; numero++) {
      const ingressoExistente =
        await prisma.ingressoConvidado.findUnique({
          where: {
            categoria_numero: {
              categoria: grupo.categoria,
              numero,
            },
          },
          select: {
            id: true,
          },
        });

      if (ingressoExistente) {
        existentes++;
        continue;
      }

      const codigo = `${grupo.prefixo}-${String(numero).padStart(
        3,
        "0"
      )}`;

      await prisma.ingressoConvidado.create({
        data: {
          categoria: grupo.categoria,
          numero,
          codigo,
          qrToken: gerarToken(),
          status: "DISPONIVEL",
        },
      });

      criados++;

      console.log(`Criado: ${codigo}`);
    }

    const totalCategoria = await prisma.ingressoConvidado.count({
      where: {
        categoria: grupo.categoria,
      },
    });

    totalCriados += criados;
    totalExistentes += existentes;

    console.log(`\nResumo de ${grupo.categoria}:`);
    console.log(`Criados: ${criados}`);
    console.log(`Já existentes: ${existentes}`);
    console.log(`Total no banco: ${totalCategoria}`);
  }

  console.log("\n=================================");
  console.log("GERAÇÃO FINALIZADA");
  console.log("=================================");
  console.log(`Novos ingressos: ${totalCriados}`);
  console.log(`Já existentes: ${totalExistentes}`);
  console.log(`Total processado: ${totalCriados + totalExistentes}`);
}

// ==========================================
// EXECUÇÃO
// ==========================================

main()
  .catch((erro) => {
    console.error("Erro ao gerar ingressos:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
