
"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";

import {
  Download,
  Eye,
  FileArchive,
  Loader2,
  X,
} from "lucide-react";

// ==========================================
// TIPOS
// ==========================================

type Categoria =
  | "PRESIDENCIA"
  | "PISTA"
  | "CONVIDADOS_SANDRO"
  | "CONVIDADOS_ALBERTO"
  | "CORTE_RIO_CARNAVAL_2026";

type Ingresso = {
  id: string;
  codigo: string;
  numero: number;
  qrImage: string;
  nomeTitular?: string | null;
  cargo?: string | null;
  tipoAcesso?: string | null;
};

type Props = {
  categoria: Categoria;
  ingressos: Ingresso[];
  modo: "individual" | "todos";
};

const FUNDO_OFICIAL = "/fundo-imprensa.png";

const nomes: Record<Categoria, string> = {
  PRESIDENCIA: "PRESIDÊNCIA",
  PISTA: "PISTA",
  CONVIDADOS_SANDRO: "CONVIDADOS SANDRO",
  CONVIDADOS_ALBERTO: "CONVIDADOS ALBERTO",
  CORTE_RIO_CARNAVAL_2026:
    "CORTE DO RIO CARNAVAL 2026",
};

// ==========================================
// UTILITÁRIOS DE IMAGEM
// ==========================================

function carregarImagem(
  src: string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new window.Image();

    imagem.onload = () => resolve(imagem);

    imagem.onerror = () => {
      reject(
        new Error(`Não foi possível carregar: ${src}`)
      );
    };

    imagem.src = src;
  });
}

function desenharRetangulo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  largura: number,
  altura: number,
  raio: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, largura, altura, raio);
  ctx.closePath();
}

function converterCanvasParaBlob(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error("Falha ao gerar imagem PNG.")
          );
        }
      },
      "image/png"
    );
  });
}

// ==========================================
// ARTE ORIGINAL
// CONVIDADOS SANDRO E ALBERTO
// ==========================================

async function criarPNGOriginal(
  ingresso: Ingresso,
  categoria: Categoria,
  fundo: HTMLImageElement
): Promise<Blob> {
  const qrCode = await carregarImagem(
    ingresso.qrImage
  );

  const canvas = document.createElement("canvas");

  canvas.width = fundo.naturalWidth;
  canvas.height = fundo.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Não foi possível criar o canvas."
    );
  }

  const largura = canvas.width;
  const altura = canvas.height;
  const centroX = largura / 2;

  // Fundo original do festival
  ctx.drawImage(
    fundo,
    0,
    0,
    largura,
    altura
  );

  // Cartão branco original
  const cardLargura = largura * 0.56;
  const cardAltura = altura * 0.405;

  const cardX =
    centroX - cardLargura / 2;

  const cardY = altura * 0.47;
  const raio = largura * 0.075;

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = largura * 0.025;
  ctx.shadowOffsetY = altura * 0.008;

  ctx.fillStyle = "#FFFFFF";

  desenharRetangulo(
    ctx,
    cardX,
    cardY,
    cardLargura,
    cardAltura,
    raio
  );

  ctx.fill();
  ctx.restore();

  // QR Code original
  const qrTamanho = cardLargura * 0.78;

  const qrX =
    centroX - qrTamanho / 2;

  const qrY =
    cardY +
    (cardAltura - qrTamanho) / 2;

  ctx.fillStyle = "#FFFFFF";

  ctx.fillRect(
    qrX,
    qrY,
    qrTamanho,
    qrTamanho
  );

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    qrCode,
    qrX,
    qrY,
    qrTamanho,
    qrTamanho
  );

  ctx.imageSmoothingEnabled = true;

  // Nome da categoria
  const titulo = nomes[categoria];
  const nomeY = altura * 0.914;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fonte = largura * 0.043;

  ctx.font = `900 ${fonte}px Arial`;

  while (
    fonte > largura * 0.02 &&
    ctx.measureText(titulo).width >
      largura * 0.76
  ) {
    fonte -= 2;
    ctx.font = `900 ${fonte}px Arial`;
  }

  ctx.lineJoin = "round";
  ctx.lineWidth = largura * 0.006;
  ctx.strokeStyle = "#4A0905";

  ctx.strokeText(
    titulo,
    centroX,
    nomeY
  );

  ctx.fillStyle = "#FFD66B";

  ctx.fillText(
    titulo,
    centroX,
    nomeY
  );

  // Número do ingresso
  const numero = String(
    ingresso.numero
  ).padStart(3, "0");

  const textoNumero = `QR CODE Nº ${numero}`;

  ctx.font = `bold ${Math.round(
    largura * 0.029
  )}px Arial`;

  ctx.lineWidth = largura * 0.005;
  ctx.strokeStyle = "#4A0905";

  ctx.strokeText(
    textoNumero,
    centroX,
    altura * 0.955
  );

  ctx.fillStyle = "#FFFFFF";

  ctx.fillText(
    textoNumero,
    centroX,
    altura * 0.955
  );

  return converterCanvasParaBlob(canvas);
}

// ==========================================
// ARTE PERSONALIZADA DA CORTE
// ==========================================

async function criarPNGCorte(
  ingresso: Ingresso,
  fundo: HTMLImageElement
): Promise<Blob> {
  const qrCode = await carregarImagem(
    ingresso.qrImage
  );

  const canvas = document.createElement("canvas");

  canvas.width = fundo.naturalWidth;
  canvas.height = fundo.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Não foi possível criar o canvas da Corte."
    );
  }

  // Mantém o tamanho original da arte.
  ctx.save();
  ctx.scale(
    canvas.width / 1080,
    canvas.height / 1365
  );

  const W = 1080;
  const H = 1365;
  const CX = W / 2;

  // ========================================
  // FUNDO ORIGINAL DO FESTIVAL
  // ========================================

  ctx.drawImage(fundo, 0, 0, W, H);

  const nome =
    ingresso.nomeTitular
      ?.trim()
      .toUpperCase() ||
    "INTEGRANTE DA CORTE";

  const acesso =
    ingresso.tipoAcesso
      ?.trim()
      .toUpperCase() ||
    "CAMAROTE";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ========================================
  // NOME DO INTEGRANTE
  // ========================================

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 12;

  ctx.fillStyle = "#FFFFFF";

  let tamanhoNome = 52;

  while (tamanhoNome > 28) {
    ctx.font = `900 ${tamanhoNome}px Arial`;

    if (
      ctx.measureText(nome).width <= 900
    ) {
      break;
    }

    tamanhoNome -= 2;
  }

  ctx.font = `900 ${tamanhoNome}px Arial`;

  ctx.fillText(
    nome,
    CX,
    640,
    900
  );

  // ========================================
  // IDENTIFICAÇÃO DA CORTE
  // ========================================

  ctx.fillStyle = "#FFE08A";
  ctx.font = "bold 31px Arial";

  ctx.fillText(
    "INTEGRANTE DA CORTE RIO CARNAVAL 2026",
    CX,
    704,
    950
  );

  ctx.restore();

  // ========================================
  // SELO CAMAROTE
  // ========================================

  const seloLargura = 500;
  const seloAltura = 75;
  const seloX = CX - seloLargura / 2;
  const seloY = 750;

  const gradiente = ctx.createLinearGradient(
    seloX,
    seloY,
    seloX + seloLargura,
    seloY
  );

  gradiente.addColorStop(0, "#D99B27");
  gradiente.addColorStop(0.5, "#FFE08A");
  gradiente.addColorStop(1, "#D99B27");

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;

  ctx.fillStyle = gradiente;

  desenharRetangulo(
    ctx,
    seloX,
    seloY,
    seloLargura,
    seloAltura,
    38
  );

  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#4A0905";
  ctx.font = "900 45px Arial";

  ctx.fillText(
    acesso,
    CX,
    seloY + seloAltura / 2,
    450
  );

  // ========================================
  // QR CODE MAIOR
  // ========================================

  const cardTamanho = 440;
  const cardX = CX - cardTamanho / 2;
  const cardY = 855;

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;

  ctx.fillStyle = "#FFFFFF";

  desenharRetangulo(
    ctx,
    cardX,
    cardY,
    cardTamanho,
    cardTamanho,
    26
  );

  ctx.fill();
  ctx.restore();

  // QR Code original com margem branca.
  const qrTamanho = 390;
  const qrX = CX - qrTamanho / 2;

  const qrY =
    cardY +
    (cardTamanho - qrTamanho) / 2;

  ctx.fillStyle = "#FFFFFF";

  ctx.fillRect(
    qrX,
    qrY,
    qrTamanho,
    qrTamanho
  );

  // Não suaviza os módulos do QR Code.
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    qrCode,
    qrX,
    qrY,
    qrTamanho,
    qrTamanho
  );

  ctx.imageSmoothingEnabled = true;

  ctx.restore();

  return converterCanvasParaBlob(canvas);
}

// ==========================================
// GERAR IMAGEM CONFORME A CATEGORIA
// ==========================================

async function gerarImagemIngresso(
  ingresso: Ingresso,
  categoria: Categoria,
  fundo: HTMLImageElement | null
): Promise<Blob> {
  // Corte do Rio Carnaval 2026
  if (
    categoria === "CORTE_RIO_CARNAVAL_2026"
  ) {
    const imagemFundo =
      fundo ||
      (await carregarImagem(FUNDO_OFICIAL));

    return criarPNGCorte(
      ingresso,
      imagemFundo
    );
  }

  // Convidados Sandro e Alberto
  if (
    categoria === "CONVIDADOS_SANDRO" ||
    categoria === "CONVIDADOS_ALBERTO"
  ) {
    const imagemFundo =
      fundo ||
      (await carregarImagem(FUNDO_OFICIAL));

    return criarPNGOriginal(
      ingresso,
      categoria,
      imagemFundo
    );
  }

  // Presidência e Pista:
  // mantém o QR Code original.
  const resposta = await fetch(
    ingresso.qrImage
  );

  if (!resposta.ok) {
    throw new Error(
      "Não foi possível carregar o QR Code."
    );
  }

  return resposta.blob();
}

// ==========================================
// DOWNLOAD DO ARQUIVO
// ==========================================

function baixarBlob(
  blob: Blob,
  nomeArquivo: string
) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function DownloadsIngressos({
  categoria,
  ingressos,
  modo,
}: Props) {
  const [processando, setProcessando] =
    useState(false);

  const [progresso, setProgresso] =
    useState(0);

  const [total, setTotal] =
    useState(0);

  const [previa, setPrevia] =
    useState<string | null>(null);

  const estilizado =
    categoria === "CONVIDADOS_SANDRO" ||
    categoria === "CONVIDADOS_ALBERTO" ||
    categoria === "CORTE_RIO_CARNAVAL_2026";

  // Libera a URL da prévia ao fechar
  // ou desmontar o componente.
  useEffect(() => {
    return () => {
      if (previa) {
        URL.revokeObjectURL(previa);
      }
    };
  }, [previa]);

  // ========================================
  // BAIXAR INGRESSO INDIVIDUAL
  // ========================================

  async function gerarIndividual() {
    const ingresso = ingressos[0];

    if (!ingresso || processando) {
      return;
    }

    setProcessando(true);

    try {
      const blob =
        await gerarImagemIngresso(
          ingresso,
          categoria,
          null
        );

      const nomeArquivo = estilizado
        ? `INGRESSO-${ingresso.codigo}.png`
        : `QR-${ingresso.codigo}.png`;

      baixarBlob(blob, nomeArquivo);
    } catch (error) {
      console.error(error);

      alert(
        "Não foi possível baixar o ingresso."
      );
    } finally {
      setProcessando(false);
    }
  }

  // ========================================
  // VISUALIZAR INGRESSO
  // ========================================

  async function visualizarIndividual() {
    const ingresso = ingressos[0];

    if (
      !ingresso ||
      !estilizado ||
      processando
    ) {
      return;
    }

    setProcessando(true);

    try {
      const blob =
        await gerarImagemIngresso(
          ingresso,
          categoria,
          null
        );

      const url =
        URL.createObjectURL(blob);

      setPrevia(url);
    } catch (error) {
      console.error(error);

      alert(
        "Não foi possível visualizar o ingresso."
      );
    } finally {
      setProcessando(false);
    }
  }

  function fecharPrevia() {
    setPrevia(null);
  }

  // ========================================
  // BAIXAR TODOS EM ZIP
  // ========================================

  async function baixarTodos() {
    if (
      processando ||
      ingressos.length === 0
    ) {
      return;
    }

    setProcessando(true);
    setProgresso(0);
    setTotal(ingressos.length);

    try {
      const zip = new JSZip();

      const precisaFundo =
        categoria === "CONVIDADOS_SANDRO" ||
        categoria === "CONVIDADOS_ALBERTO" ||
        categoria === "CORTE_RIO_CARNAVAL_2026";

      // Carrega o fundo apenas uma vez.
      const fundo = precisaFundo
        ? await carregarImagem(FUNDO_OFICIAL)
        : null;

      // Processamento sequencial para
      // evitar sobrecarga de memória.
      for (
        let i = 0;
        i < ingressos.length;
        i++
      ) {
        const ingresso = ingressos[i];

        const blob =
          await gerarImagemIngresso(
            ingresso,
            categoria,
            fundo
          );

        const nomeArquivo = estilizado
          ? `INGRESSO-${ingresso.codigo}.png`
          : `QR-${ingresso.codigo}.png`;

        zip.file(nomeArquivo, blob);

        setProgresso(i + 1);

        // Permite atualizar a interface.
        if ((i + 1) % 5 === 0) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 0);
          });
        }
      }

      const arquivoZip =
        await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 6,
          },
        });

      baixarBlob(
        arquivoZip,
        `INGRESSOS-${categoria}.zip`
      );
    } catch (error) {
      console.error(
        "Erro ao gerar arquivo ZIP:",
        error
      );

      alert(
        "Não foi possível gerar o ZIP. Tente novamente."
      );
    } finally {
      setProcessando(false);
      setProgresso(0);
      setTotal(0);
    }
  }

  // ========================================
  // BOTÃO DE DOWNLOAD ZIP
  // ========================================

  if (modo === "todos") {
    return (
      <button
        type="button"
        onClick={baixarTodos}
        disabled={
          processando ||
          ingressos.length === 0
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-4 py-4 text-sm font-extrabold text-[#231A0A] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      >
        {processando ? (
          <>
            <Loader2
              size={19}
              className="animate-spin"
            />

            {progresso < total
              ? `Preparando ${progresso}/${total}...`
              : "Compactando ZIP..."}
          </>
        ) : (
          <>
            <FileArchive size={20} />
            Baixar todos em ZIP (
            {ingressos.length})
          </>
        )}
      </button>
    );
  }

  // ========================================
  // DOWNLOAD INDIVIDUAL E PRÉVIA
  // ========================================

  return (
    <>
      <div
        className={`mt-4 grid gap-2 ${
          estilizado
            ? "grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {estilizado && (
          <button
            type="button"
            onClick={visualizarIndividual}
            disabled={processando}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#F4C75D]/40 bg-[#F4C75D]/10 px-3 py-3 text-xs font-bold text-[#F4C75D] transition hover:bg-[#F4C75D]/20 disabled:opacity-60"
          >
            <Eye size={17} />
            Visualizar
          </button>
        )}

        <button
          type="button"
          onClick={gerarIndividual}
          disabled={processando}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-3 py-3 text-xs font-bold text-[#231A0A] transition hover:brightness-110 disabled:opacity-60"
        >
          {processando ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Download size={17} />
          )}

          Baixar ingresso
        </button>
      </div>

      {/* MODAL DE VISUALIZAÇÃO */}
      {previa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="flex max-h-[95dvh] w-full max-w-md flex-col rounded-2xl border border-white/15 bg-[#141D25] p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">
                {nomes[categoria]}
              </p>

              <button
                type="button"
                onClick={fecharPrevia}
                aria-label="Fechar"
                className="rounded-lg bg-white/10 p-2 text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previa}
              alt="Prévia do ingresso estilizado"
              className="mx-auto min-h-0 max-h-[75dvh] w-auto rounded-lg object-contain"
            />

            <button
              type="button"
              onClick={() => {
                const ingresso = ingressos[0];

                if (!ingresso) {
                  return;
                }

                fetch(previa)
                  .then((resposta) => {
                    if (!resposta.ok) {
                      throw new Error(
                        "Falha ao carregar a prévia."
                      );
                    }

                    return resposta.blob();
                  })
                  .then((blob) => {
                    baixarBlob(
                      blob,
                      `INGRESSO-${ingresso.codigo}.png`
                    );
                  })
                  .catch(() => {
                    alert(
                      "Erro ao baixar a prévia."
                    );
                  });
              }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-4 py-3 text-sm font-bold text-[#231A0A]"
            >
              <Download size={17} />
              Baixar esta imagem
            </button>
          </div>
        </div>
      )}
    </>
  );
}
