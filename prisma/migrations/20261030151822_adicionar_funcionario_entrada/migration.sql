-- AlterTable
ALTER TABLE "Entrada" ADD COLUMN     "funcionarioNumero" INTEGER;

-- CreateIndex
CREATE INDEX "Entrada_funcionarioNumero_idx" ON "Entrada"("funcionarioNumero");
