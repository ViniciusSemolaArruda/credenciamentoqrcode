-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "StatusIngresso" AS ENUM ('DISPONIVEL', 'UTILIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FUNCIONARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "limite" INTEGER NOT NULL DEFAULT 20,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingresso" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "StatusIngresso" NOT NULL DEFAULT 'DISPONIVEL',
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrada" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingressoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entrada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Escola_nome_key" ON "Escola"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Ingresso_codigo_key" ON "Ingresso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Ingresso_qrToken_key" ON "Ingresso"("qrToken");

-- CreateIndex
CREATE INDEX "Ingresso_escolaId_status_idx" ON "Ingresso"("escolaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ingresso_escolaId_numero_key" ON "Ingresso"("escolaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Entrada_ingressoId_key" ON "Entrada"("ingressoId");

-- CreateIndex
CREATE INDEX "Entrada_usuarioId_idx" ON "Entrada"("usuarioId");

-- CreateIndex
CREATE INDEX "Entrada_horario_idx" ON "Entrada"("horario");

-- AddForeignKey
ALTER TABLE "Ingresso" ADD CONSTRAINT "Ingresso_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_ingressoId_fkey" FOREIGN KEY ("ingressoId") REFERENCES "Ingresso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
