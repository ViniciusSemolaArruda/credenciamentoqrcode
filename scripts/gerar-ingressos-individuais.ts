
import "dotenv/config";

import { randomBytes } from "node:crypto";

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ==========================================
// CONFIGURAÇÃO DO BANCO
// ==========================================

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não encontrada no ambiente."
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

// ==========================================
// CATEGORIAS E QUANTIDADES
// ==========================================

const categorias = [
  {
    categoria: "PRESIDENCIA" as const,
    prefixo: "PRESIDENCIA",
    quantidade: 15,
  },
  {
    categoria: "PISTA" as const,
    prefixo: "PISTA",
    quantidade: 15,
  },
];

// ==========================================
// GERAR TOKEN SEGURO
// ==========================================

function gerarToken(): string {
  return randomBytes(32).toString("hex");
}

// ==========================================
// VERIFICAR ESTRUTURA DO BANCO
// ==========================================

async function verificarEstrutura() {
  const colunas = await prisma.$queryRaw<
    Array<{ column_name: string }>
  >`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'IngressoConvidado'
  `;

  const nomes = new Set(
    colunas.map((coluna) => coluna.column_name)
  );

  const obrigatorias = [
    "id",
    "codigo",
    "qrToken",
    "numero",
    "categoria",
    "status",
  ];

  const ausentes = obrigatorias.filter(
    (coluna) => !nomes.has(coluna)
  );

  if (ausentes.length > 0) {
    throw new Error(
      "A tabela IngressoConvidado não está atualizada. " +
      "Colunas ausentes: " +
      ausentes.join(", ") +
      ". Verifique as migrações antes de continuar."
    );
  }
}

// ==========================================
// GERAR INGRESSOS
// ==========================================

async function main() {
  console.log("====================================");
  console.log("GERAÇÃO DE INGRESSOS INDIVIDUAIS");
  console.log("====================================");

  await verificarEstrutura();

  // Impede que dois processos deste script
  // executem a geração simultaneamente.
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(20261119, 30)
      `;

      // Verificar os registros já existentes.
      // Não alterar ingressos que já foram emitidos.
      const existentes =
        await tx.ingressoConvidado.findMany({
          select: {
            codigo: true,
            numero: true,
            categoria: true,
          },
        });

      const numerosValidos = new Set(
        categorias.flatMap((config) =>
          Array.from(
            { length: config.quantidade },
            (_, indice) =>
              `${config.categoria}:${indice + 1}`
          )
        )
      );

      for (const ingresso of existentes) {
        const chave =
          `${ingresso.categoria}:${ingresso.numero}`;

        if (!numerosValidos.has(chave)) {
          throw new Error(
            `Ingresso existente fora do planejamento: ${ingresso.codigo}. ` +
            "Nenhuma alteração será realizada."
          );
        }

        const codigoEsperado =
          `${ingresso.categoria}-${String(
            ingresso.numero
          ).padStart(2, "0")}`;

        if (ingresso.codigo !== codigoEsperado) {
          throw new Error(
            `Conflito no ingresso ${ingresso.codigo}. ` +
            `Esperado: ${codigoEsperado}.`
          );
        }
      }

      let criados = 0;
      let preservados = 0;

      for (const config of categorias) {
        console.log(
          `\nCategoria: ${config.categoria}`
        );

        for (
          let numero = 1;
          numero <= config.quantidade;
          numero++
        ) {
          const codigo =
            `${config.prefixo}-${String(
              numero
            ).padStart(2, "0")}`;

          const existente = existentes.find(
            (ingresso) =>
              ingresso.categoria === config.categoria &&
              ingresso.numero === numero
          );

          if (existente) {
            preservados++;

            console.log(
              `[EXISTENTE] ${codigo}`
            );

            continue;
          }

          // Também verifica possíveis colisões
          // com os tokens das escolas.
          let qrToken: string;

          do {
            qrToken = gerarToken();

            const [escola, convidado] =
              await Promise.all([
                tx.ingresso.findUnique({
                  where: { qrToken },
                  select: { id: true },
                }),
                tx.ingressoConvidado.findUnique({
                  where: { qrToken },
                  select: { id: true },
                }),
              ]);

            if (!escola && !convidado) {
              break;
            }
          } while (true);

          await tx.ingressoConvidado.create({
            data: {
              codigo,
              qrToken,
              numero,
              categoria: config.categoria,
              status: "DISPONIVEL",
            },
          });

          criados++;

          console.log(`[CRIADO] ${codigo}`);
        }
      }

      console.log("\n====================================");
      console.log(`Criados: ${criados}`);
      console.log(`Preservados: ${preservados}`);
      console.log("Total esperado: 30");
      console.log("====================================");
    },
    {
      maxWait: 10000,
      timeout: 60000,
    }
  );
}

// ==========================================
// EXECUÇÃO
// ==========================================

main()
  .catch((error) => {
    console.error("\nErro na geração:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
