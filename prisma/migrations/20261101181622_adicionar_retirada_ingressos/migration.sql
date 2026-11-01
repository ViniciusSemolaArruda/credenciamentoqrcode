-- CreateTable
CREATE TABLE "RetiradaIngresso" (
    "id" TEXT NOT NULL,
    "ingressoId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "retiradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetiradaIngresso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetiradaIngresso_ingressoId_key" ON "RetiradaIngresso"("ingressoId");

-- CreateIndex
CREATE INDEX "RetiradaIngresso_email_idx" ON "RetiradaIngresso"("email");

-- CreateIndex
CREATE INDEX "RetiradaIngresso_retiradoEm_idx" ON "RetiradaIngresso"("retiradoEm");

-- AddForeignKey
ALTER TABLE "RetiradaIngresso" ADD CONSTRAINT "RetiradaIngresso_ingressoId_fkey" FOREIGN KEY ("ingressoId") REFERENCES "Ingresso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
