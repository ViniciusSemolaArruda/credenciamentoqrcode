
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { randomBytes } from "node:crypto";

// ==========================================
// CONEXÃO COM O BANCO DE DADOS
// ==========================================

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não encontrada no arquivo .env"
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const LIMITE_INGRESSOS = 20;

// ==========================================
// ESCOLAS DE SAMBA
// ==========================================

const escolas = [
  "G.R.E.S. Império Serrano",
  "G.R.E.S. São Clemente",
  "G.R.E.S. Unidos do Jacarezinho",
  "Acadêmicos de Niterói",
  "G.R.E.S. Unidos da Ponte",
  "Unidos de Bangu",
  "Inocentes de Belford Roxo",
  "Estácio de Sá",
  "Unidos de Padre Miguel",
  "Arranco",
  "Em Cima da Hora",
  "Botafogo Samba Clube",
  "União do Parque Acari",
  "Porto da Pedra",
  "Acadêmicos de Vigário Geral",
  "União da Ilha do Governador",
  "Acadêmicos de Santa Cruz",
];

// ==========================================
// GERAR TOKEN SEGURO
// ==========================================

function gerarToken(): string {
  return randomBytes(32).toString("hex");
}

// ==========================================
// CADASTRAR ESCOLAS E INGRESSOS
// ==========================================

async function main() {
  console.log("\n==================================");
  console.log(" SISTEMA DE CREDENCIAMENTO SAMBA");
  console.log("==================================\n");

  let escolasCriadas = 0;
  let ingressosCriados = 0;

  for (const nome of escolas) {
    // Busca ou cadastra a escola
    const escolaExistente = await prisma.escola.findUnique({
      where: { nome },
    });

    const escola = await prisma.escola.upsert({
      where: { nome },
      update: {},
      create: {
        nome,
        limite: LIMITE_INGRESSOS,
        ativa: true,
      },
    });

    if (!escolaExistente) {
      escolasCriadas++;
    }

    // Busca os ingressos já cadastrados
    const ingressosExistentes = await prisma.ingresso.findMany({
      where: {
        escolaId: escola.id,
      },
      select: {
        numero: true,
      },
    });

    const numerosExistentes = new Set(
      ingressosExistentes.map(
        (ingresso) => ingresso.numero
      )
    );

    let criadosNestaEscola = 0;

    // Gera os 20 ingressos individuais
    for (
      let numero = 1;
      numero <= LIMITE_INGRESSOS;
      numero++
    ) {
      // Não duplica ingressos existentes
      if (numerosExistentes.has(numero)) {
        continue;
      }

      const numeroFormatado = String(
        numero
      ).padStart(2, "0");

      // Código visual do ingresso
      const codigo = `${escola.id}-${numeroFormatado}`;

      // Token exclusivo e seguro
      const qrToken = gerarToken();

      await prisma.ingresso.create({
        data: {
          codigo,
          qrToken,
          numero,
          escolaId: escola.id,
          status: "DISPONIVEL",
        },
      });

      ingressosCriados++;
      criadosNestaEscola++;
    }

    const total = await prisma.ingresso.count({
      where: {
        escolaId: escola.id,
      },
    });

    console.log(`Escola: ${nome}`);
    console.log(
      `Ingressos: ${total}/${LIMITE_INGRESSOS}`
    );
    console.log(
      `Novos ingressos: ${criadosNestaEscola}`
    );
    console.log("----------------------------------");
  }

  // ==========================================
  // RESUMO FINAL
  // ==========================================

  const totalEscolas = await prisma.escola.count();

  const totalIngressos = await prisma.ingresso.count();

  const ingressosDisponiveis =
    await prisma.ingresso.count({
      where: {
        status: "DISPONIVEL",
      },
    });

  const ingressosUtilizados =
    await prisma.ingresso.count({
      where: {
        status: "UTILIZADO",
      },
    });

  console.log("\n==================================");
  console.log(" CADASTRO FINALIZADO");
  console.log("==================================");

  console.log(`Escolas criadas: ${escolasCriadas}`);
  console.log(`Ingressos criados: ${ingressosCriados}`);

  console.log(`Total de escolas: ${totalEscolas}`);
  console.log(`Total de ingressos: ${totalIngressos}`);

  console.log(
    `Ingressos disponíveis: ${ingressosDisponiveis}`
  );

  console.log(
    `Ingressos utilizados: ${ingressosUtilizados}`
  );

  console.log("==================================\n");
}

// ==========================================
// EXECUTAR
// ==========================================

main()
  .catch((error) => {
    console.error(
      "\nErro ao executar o seed:",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
