-- CreateTable
CREATE TABLE "VeiculoImprensa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VeiculoImprensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngressoImprensa" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "StatusIngresso" NOT NULL DEFAULT 'DISPONIVEL',
    "veiculoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngressoImprensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntradaImprensa" (
    "id" TEXT NOT NULL,
    "ingressoImprensaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "funcionarioNumero" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntradaImprensa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VeiculoImprensa_nome_key" ON "VeiculoImprensa"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "VeiculoImprensa_slug_key" ON "VeiculoImprensa"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "IngressoImprensa_codigo_key" ON "IngressoImprensa"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "IngressoImprensa_qrToken_key" ON "IngressoImprensa"("qrToken");

-- CreateIndex
CREATE INDEX "IngressoImprensa_veiculoId_status_idx" ON "IngressoImprensa"("veiculoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IngressoImprensa_veiculoId_numero_key" ON "IngressoImprensa"("veiculoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "EntradaImprensa_ingressoImprensaId_key" ON "EntradaImprensa"("ingressoImprensaId");

-- CreateIndex
CREATE INDEX "EntradaImprensa_usuarioId_idx" ON "EntradaImprensa"("usuarioId");

-- CreateIndex
CREATE INDEX "EntradaImprensa_horario_idx" ON "EntradaImprensa"("horario");

-- CreateIndex
CREATE INDEX "EntradaImprensa_funcionarioNumero_idx" ON "EntradaImprensa"("funcionarioNumero");

-- AddForeignKey
ALTER TABLE "IngressoImprensa" ADD CONSTRAINT "IngressoImprensa_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "VeiculoImprensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaImprensa" ADD CONSTRAINT "EntradaImprensa_ingressoImprensaId_fkey" FOREIGN KEY ("ingressoImprensaId") REFERENCES "IngressoImprensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaImprensa" ADD CONSTRAINT "EntradaImprensa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
