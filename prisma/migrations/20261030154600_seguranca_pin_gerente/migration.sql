-- CreateTable
CREATE TABLE "ControlePinGerente" (
    "id" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlePinGerente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaPinGerente" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "funcionarioNumero" INTEGER NOT NULL,
    "ingressoId" TEXT,
    "resultado" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaPinGerente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TentativaPinGerente_criadoEm_idx" ON "TentativaPinGerente"("criadoEm");

-- CreateIndex
CREATE INDEX "TentativaPinGerente_funcionarioId_idx" ON "TentativaPinGerente"("funcionarioId");

-- CreateIndex
CREATE INDEX "TentativaPinGerente_resultado_idx" ON "TentativaPinGerente"("resultado");
