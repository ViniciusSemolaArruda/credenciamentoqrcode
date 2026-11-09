-- CreateEnum
CREATE TYPE "CategoriaConvidado" AS ENUM ('PRESIDENCIA', 'PISTA');

-- CreateTable
CREATE TABLE "IngressoConvidado" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "categoria" "CategoriaConvidado" NOT NULL,
    "status" "StatusIngresso" NOT NULL DEFAULT 'DISPONIVEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngressoConvidado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntradaConvidado" (
    "id" TEXT NOT NULL,
    "ingressoConvidadoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "funcionarioNumero" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntradaConvidado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngressoConvidado_codigo_key" ON "IngressoConvidado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "IngressoConvidado_qrToken_key" ON "IngressoConvidado"("qrToken");

-- CreateIndex
CREATE INDEX "IngressoConvidado_categoria_status_idx" ON "IngressoConvidado"("categoria", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IngressoConvidado_categoria_numero_key" ON "IngressoConvidado"("categoria", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "EntradaConvidado_ingressoConvidadoId_key" ON "EntradaConvidado"("ingressoConvidadoId");

-- CreateIndex
CREATE INDEX "EntradaConvidado_usuarioId_idx" ON "EntradaConvidado"("usuarioId");

-- CreateIndex
CREATE INDEX "EntradaConvidado_horario_idx" ON "EntradaConvidado"("horario");

-- CreateIndex
CREATE INDEX "EntradaConvidado_funcionarioNumero_idx" ON "EntradaConvidado"("funcionarioNumero");

-- AddForeignKey
ALTER TABLE "EntradaConvidado" ADD CONSTRAINT "EntradaConvidado_ingressoConvidadoId_fkey" FOREIGN KEY ("ingressoConvidadoId") REFERENCES "IngressoConvidado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaConvidado" ADD CONSTRAINT "EntradaConvidado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
