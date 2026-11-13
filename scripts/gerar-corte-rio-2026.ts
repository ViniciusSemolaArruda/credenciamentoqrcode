
import "dotenv/config";

import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

// ==========================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não configurada no .env"
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

// ==========================================
// CATEGORIA EXCLUSIVA DA CORTE
// ==========================================

const CATEGORIA =
  "CORTE_RIO_CARNAVAL_2026" as const;

// ==========================================
// INTEGRANTES DA CORTE
// ==========================================

const integrantes = [
  {
    numero: 1,
    nomeTitular: "Alex de Oliveira Silva",
    cargo: "Integrante da Corte",
  },
  {
    numero: 2,
    nomeTitular: "Moacir de Oliveira Silva",
    cargo: "Integrante da Corte",
  },
  {
    numero: 3,
    nomeTitular: "Danilo Vieira",
    cargo: "Rei",
  },
  {
    numero: 4,
    nomeTitular: "Carol Xavier",
    cargo: "Rainha",
  },
  {
    numero: 5,
    nomeTitular: "Samara Trindade",
    cargo: "1ª Princesa",
  },
  {
    numero: 6,
    nomeTitular: "Luana Fernandes",
    cargo: "2ª Princesa",
  },
];

// ==========================================
// GERAR TOKEN SEGURO
// 32 BYTES = 64 CARACTERES HEXADECIMAIS
// ==========================================

function gerarToken(): string {
  return randomBytes(32).toString("hex");
}

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

async function main() {
  console.log("");
  console.log("====================================");
  console.log(" CORTE DO RIO CARNAVAL 2026");
  console.log("====================================");
  console.log("");

  console.log(
    "Iniciando cadastro dos ingressos da Corte..."
  );

  let criados = 0;
  let existentes = 0;

  // ========================================
  // PROCESSAR APENAS OS 6 INTEGRANTES
  // ========================================

  for (const integrante of integrantes) {
    const numeroFormatado = String(
      integrante.numero
    ).padStart(3, "0");

    const codigo =
      `CORTE-2026-${numeroFormatado}`;

    // ======================================
    // VERIFICAR SE O INGRESSO JÁ EXISTE
    // ======================================

    const ingressoExistente =
      await prisma.ingressoConvidado.findUnique({
        where: {
          categoria_numero: {
            categoria: CATEGORIA,
            numero: integrante.numero,
          },
        },
        select: {
          id: true,
          codigo: true,
          status: true,
          nomeTitular: true,
          cargo: true,
          tipoAcesso: true,
        },
      });

    // ======================================
    // SE EXISTIR, NÃO ALTERAR NADA
    // ======================================

    if (ingressoExistente) {
      existentes++;

      console.log("");
      console.log(
        `[EXISTENTE] ${ingressoExistente.codigo}`
      );
      console.log(
        `Titular: ${
          ingressoExistente.nomeTitular ||
          "Não informado"
        }`
      );
      console.log(
        `Status: ${ingressoExistente.status}`
      );
      console.log(
        "QR Code preservado. Nenhuma alteração realizada."
      );

      continue;
    }

    // ======================================
    // CRIAR NOVO INGRESSO
    // ======================================

    const novoIngresso =
      await prisma.ingressoConvidado.create({
        data: {
          categoria: CATEGORIA,
          numero: integrante.numero,
          codigo,
          qrToken: gerarToken(),
          status: "DISPONIVEL",
          nomeTitular: integrante.nomeTitular,
          cargo: integrante.cargo,
          tipoAcesso: "CAMAROTE",
        },
        select: {
          id: true,
          codigo: true,
          numero: true,
          nomeTitular: true,
          cargo: true,
          tipoAcesso: true,
          status: true,
        },
      });

    criados++;

    console.log("");
    console.log(
      `[CRIADO] ${novoIngresso.codigo}`
    );
    console.log(
      `Nome: ${novoIngresso.nomeTitular}`
    );
    console.log(
      `Cargo: ${novoIngresso.cargo}`
    );
    console.log(
      `Acesso: ${novoIngresso.tipoAcesso}`
    );
    console.log(
      `Status: ${novoIngresso.status}`
    );
  }

  // ==========================================
  // CONFERIR TOTAL DA CORTE
  // ==========================================

  const totalNoBanco =
    await prisma.ingressoConvidado.count({
      where: {
        categoria: CATEGORIA,
      },
    });

  console.log("");
  console.log("====================================");
  console.log(" RESUMO FINAL");
  console.log("====================================");
  console.log("");

  console.log(`Ingressos criados: ${criados}`);
  console.log(
    `Ingressos já existentes: ${existentes}`
  );
  console.log(
    `Total da Corte no banco: ${totalNoBanco}`
  );

  console.log("");

  if (totalNoBanco === integrantes.length) {
    console.log(
      "SUCESSO: Os 6 ingressos da Corte estão cadastrados."
    );
  } else {
    console.log(
      "ATENÇÃO: O total de ingressos da Corte é diferente de 6."
    );
  }

  console.log("");
  console.log(
    "Nenhuma outra categoria foi modificada."
  );
  console.log("");
}

// ==========================================
// EXECUTAR E DESCONECTAR
// ==========================================

main()
  .catch((erro) => {
    console.error("");
    console.error(
      "Erro ao gerar ingressos da Corte:",
      erro
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
