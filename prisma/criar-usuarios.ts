
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const rl = createInterface({ input, output });

async function criarUsuario(
  nome: string,
  email: string,
  senha: string,
  role: "ADMIN" | "FUNCIONARIO"
) {
  const senhaHash = await bcrypt.hash(senha, 12);

  await prisma.usuario.upsert({
    where: { email },
    update: {
      nome,
      senhaHash,
      role,
      ativo: true,
    },
    create: {
      nome,
      email,
      senhaHash,
      role,
      ativo: true,
    },
  });

  console.log(`✓ ${nome} cadastrado com sucesso!`);
}

async function main() {
  console.log("\n=== CADASTRO DE ACESSOS ===\n");

  const contas = [
    {
      nome: "Administrador",
      email: "gerente@credenciamento.local",
      role: "ADMIN" as const,
    },
    {
      nome: "Equipe de Credenciamento",
      email: "equipe@credenciamento.local",
      role: "FUNCIONARIO" as const,
    },
  ];

  for (const conta of contas) {
    console.log(`\n${conta.nome}`);
    console.log(`Login: ${conta.email}`);

    const senha = await rl.question("Defina a senha: ");

    if (senha.length < 12) {
      throw new Error(
        "A senha deve conter pelo menos 12 caracteres."
      );
    }

    await criarUsuario(
      conta.nome,
      conta.email,
      senha,
      conta.role
    );
  }

  console.log("\n✓ As duas contas foram configuradas!");
}

main()
  .catch((error) => {
    console.error("Erro:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
