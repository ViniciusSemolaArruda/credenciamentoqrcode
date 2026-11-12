
import "dotenv/config";

import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

// ==========================================
// VEÍCULOS DE IMPRENSA
// ==========================================

const veiculos = [
  {
    nome: "Apoteose",
    slug: "apoteose",
  },
  {
    nome: "Mais Carnaval",
    slug: "mais-carnaval",
  },
  {
    nome: "Sambemos",
    slug: "sambemos",
  },
  {
    nome: "Dose de Cultura",
    slug: "dose-de-cultura",
  },
  {
    nome: "CarnaViva",
    slug: "carnaviva",
  },
  {
    nome: "Xiado Carioca",
    slug: "xiado-carioca",
  },
  {
    nome: "Rádio Arquibancada",
    slug: "radio-arquibancada",
  },
  {
    nome: "CARNAVALESCO",
    slug: "carnavalesco",
  },
];

const QUANTIDADE_POR_VEICULO = 10;

// ==========================================
// GERAR TOKEN SEGURO
// ==========================================

function gerarToken() {
  return randomBytes(32).toString("hex");
}

// ==========================================
// GERAR INGRESSOS
// ==========================================

async function main() {
  console.log("Iniciando geração dos ingressos da imprensa...");

  let criados = 0;
  let existentes = 0;

  for (const item of veiculos) {
    const veiculo = await prisma.veiculoImprensa.upsert({
      where: {
        slug: item.slug,
      },
      update: {
        nome: item.nome,
      },
      create: {
        nome: item.nome,
        slug: item.slug,
      },
    });

    console.log(`\nVeículo: ${veiculo.nome}`);

    for (let numero = 1; numero <= QUANTIDADE_POR_VEICULO; numero++) {
      const codigo = `${item.slug.toUpperCase()}-${String(numero).padStart(2, "0")}`;

      const ingressoExistente =
        await prisma.ingressoImprensa.findUnique({
          where: {
            veiculoId_numero: {
              veiculoId: veiculo.id,
              numero,
            },
          },
        });

      if (ingressoExistente) {
        existentes++;

        console.log(`  Já existe: ${ingressoExistente.codigo}`);
        continue;
      }

      await prisma.ingressoImprensa.create({
        data: {
          codigo,
          qrToken: gerarToken(),
          numero,
          veiculoId: veiculo.id,
          status: "DISPONIVEL",
        },
      });

      criados++;

      console.log(`  Criado: ${codigo}`);
    }
  }

  const total = await prisma.ingressoImprensa.count();

  console.log("\n==================================");
  console.log("GERAÇÃO FINALIZADA");
  console.log("==================================");
  console.log(`Ingressos criados: ${criados}`);
  console.log(`Ingressos já existentes: ${existentes}`);
  console.log(`Total de ingressos de imprensa: ${total}`);
  console.log("==================================");
}

main()
  .catch((error) => {
    console.error("Erro ao gerar ingressos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
