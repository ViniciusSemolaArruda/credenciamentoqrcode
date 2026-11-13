
"use client";

import { useState } from "react";
import JSZip from "jszip";
import {
  Download,
  Eye,
  FileArchive,
  Loader2,
  X,
} from "lucide-react";

type Categoria =
  | "PRESIDENCIA"
  | "PISTA"
  | "CONVIDADOS_SANDRO"
  | "CONVIDADOS_ALBERTO";

type Ingresso = {
  id: string;
  codigo: string;
  numero: number;
  qrImage: string;
};

type Props = {
  categoria: Categoria;
  ingressos: Ingresso[];
  modo: "individual" | "todos";
};

const nomes: Record<Categoria, string> = {
  PRESIDENCIA: "PRESIDÊNCIA",
  PISTA: "PISTA",
  CONVIDADOS_SANDRO: "CONVIDADOS SANDRO",
  CONVIDADOS_ALBERTO: "CONVIDADOS ALBERTO",
};

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new window.Image();

    imagem.onload = () => resolve(imagem);
    imagem.onerror = () =>
      reject(new Error(`Não foi possível carregar: ${src}`));

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

async function criarPNG(
  ingresso: Ingresso,
  categoria: Categoria,
  fundo: HTMLImageElement
): Promise<Blob> {
  const qrCode = await carregarImagem(ingresso.qrImage);

  const canvas = document.createElement("canvas");

  canvas.width = fundo.naturalWidth;
  canvas.height = fundo.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível criar o canvas.");
  }

  const largura = canvas.width;
  const altura = canvas.height;
  const centroX = largura / 2;

  // Arte original do festival
  ctx.drawImage(fundo, 0, 0, largura, altura);

  // Cartão branco
  const cardLargura = largura * 0.56;
  const cardAltura = altura * 0.405;
  const cardX = centroX - cardLargura / 2;
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

  // QR Code original, sem modificar os dados
  const qrTamanho = cardLargura * 0.78;
  const qrX = centroX - qrTamanho / 2;
  const qrY = cardY + (cardAltura - qrTamanho) / 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(qrX, qrY, qrTamanho, qrTamanho);

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
    ctx.measureText(titulo).width > largura * 0.76
  ) {
    fonte -= 2;
    ctx.font = `900 ${fonte}px Arial`;
  }

  ctx.lineJoin = "round";
  ctx.lineWidth = largura * 0.006;
  ctx.strokeStyle = "#4A0905";
  ctx.strokeText(titulo, centroX, nomeY);

  ctx.fillStyle = "#FFD66B";
  ctx.fillText(titulo, centroX, nomeY);

  // Número do ingresso
  const numero = String(ingresso.numero).padStart(3, "0");
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

  // Converter para PNG
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Falha ao gerar PNG."));
        }
      },
      "image/png"
    );
  });
}

function baixarBlob(blob: Blob, nomeArquivo: string) {
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

export default function DownloadsIngressos({
  categoria,
  ingressos,
  modo,
}: Props) {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [total, setTotal] = useState(0);
  const [previa, setPrevia] = useState<string | null>(null);

  const estilizado =
    categoria === "CONVIDADOS_SANDRO" ||
    categoria === "CONVIDADOS_ALBERTO";

  async function gerarIndividual() {
    const ingresso = ingressos[0];

    if (!ingresso) return;

    setProcessando(true);

    try {
      if (!estilizado) {
        const resposta = await fetch(ingresso.qrImage);
        const blob = await resposta.blob();

        baixarBlob(
          blob,
          `QR-${ingresso.codigo}.png`
        );

        return;
      }

      const fundo = await carregarImagem(
        "/fundo-imprensa.png"
      );

      const blob = await criarPNG(
        ingresso,
        categoria,
        fundo
      );

      baixarBlob(
        blob,
        `INGRESSO-${ingresso.codigo}.png`
      );
    } catch (error) {
      console.error(error);
      alert("Não foi possível baixar o ingresso.");
    } finally {
      setProcessando(false);
    }
  }

  async function visualizarIndividual() {
    const ingresso = ingressos[0];

    if (!ingresso || !estilizado) return;

    setProcessando(true);

    try {
      const fundo = await carregarImagem(
        "/fundo-imprensa.png"
      );

      const blob = await criarPNG(
        ingresso,
        categoria,
        fundo
      );

      const url = URL.createObjectURL(blob);
      setPrevia(url);
    } catch (error) {
      console.error(error);
      alert("Não foi possível visualizar o ingresso.");
    } finally {
      setProcessando(false);
    }
  }

  function fecharPrevia() {
    if (previa) {
      URL.revokeObjectURL(previa);
    }

    setPrevia(null);
  }

  async function baixarTodos() {
    if (processando || ingressos.length === 0) return;

    setProcessando(true);
    setProgresso(0);
    setTotal(ingressos.length);

    try {
      const zip = new JSZip();

      const fundo = estilizado
        ? await carregarImagem("/fundo-imprensa.png")
        : null;

      // Processamento sequencial para evitar
      // sobrecarga de memória no navegador.
      for (let i = 0; i < ingressos.length; i++) {
        const ingresso = ingressos[i];

        let blob: Blob;
        let nomeArquivo: string;

        if (estilizado && fundo) {
          blob = await criarPNG(
            ingresso,
            categoria,
            fundo
          );

          nomeArquivo =
            `INGRESSO-${ingresso.codigo}.png`;
        } else {
          const resposta = await fetch(
            ingresso.qrImage
          );

          blob = await resposta.blob();

          nomeArquivo =
            `QR-${ingresso.codigo}.png`;
        }

        zip.file(nomeArquivo, blob);

        setProgresso(i + 1);

        // Permite que a interface atualize
        // o progresso durante a geração.
        if ((i + 1) % 5 === 0) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 0);
          });
        }
      }

      const arquivoZip = await zip.generateAsync({
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

  if (modo === "todos") {
    return (
      <button
        type="button"
        onClick={baixarTodos}
        disabled={processando || ingressos.length === 0}
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
            Baixar todos em ZIP ({ingressos.length})
          </>
        )}
      </button>
    );
  }

  return (
    <>
      <div className={`mt-4 grid gap-2 ${
        estilizado ? "grid-cols-2" : "grid-cols-1"
      }`}>
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
                if (!ingresso) return;

                fetch(previa)
                  .then((resposta) => resposta.blob())
                  .then((blob) => {
                    baixarBlob(
                      blob,
                      `INGRESSO-${ingresso.codigo}.png`
                    );
                  })
                  .catch(() => {
                    alert("Erro ao baixar a prévia.");
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
