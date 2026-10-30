-- DropIndex
DROP INDEX "Entrada_ingressoId_key";

-- CreateTable
CREATE TABLE "LiberacaoIngresso" (
    "id" TEXT NOT NULL,
    "ingressoId" TEXT NOT NULL,
    "gerenteId" TEXT NOT NULL,
    "funcionarioNumero" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "autorizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entradaAnteriorId" TEXT,

    CONSTRAINT "LiberacaoIngresso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiberacaoIngresso_ingressoId_idx" ON "LiberacaoIngresso"("ingressoId");

-- CreateIndex
CREATE INDEX "LiberacaoIngresso_gerenteId_idx" ON "LiberacaoIngresso"("gerenteId");

-- CreateIndex
CREATE INDEX "LiberacaoIngresso_autorizadoEm_idx" ON "LiberacaoIngresso"("autorizadoEm");

-- CreateIndex
CREATE INDEX "Entrada_ingressoId_idx" ON "Entrada"("ingressoId");

-- AddForeignKey
ALTER TABLE "LiberacaoIngresso" ADD CONSTRAINT "LiberacaoIngresso_ingressoId_fkey" FOREIGN KEY ("ingressoId") REFERENCES "Ingresso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiberacaoIngresso" ADD CONSTRAINT "LiberacaoIngresso_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
