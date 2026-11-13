
"use client";

import { useState } from "react";
import { Download, Eye, Loader2, X } from "lucide-react";

type CategoriaConvidado =
  | "CONVIDADOS_SANDRO"
  | "CONVIDADOS_ALBERTO";

type Props = {
  qrImage: string;
  codigo: string;
  numero: number;
  categoria: CategoriaConvidado;
};

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new window.Image();

    imagem.onload = () => resolve(imagem);
    imagem.onerror = () =>
      reject(new Error(`Erro ao carregar: ${src}`));

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

function obterNome(categoria: CategoriaConvidado) {
  return categoria === "CONVIDADOS_SANDRO"
    ? "CONVIDADOS SANDRO"
    : "CONVIDADOS ALBERTO";
}

export default function IngressoConvidadoDownload({
  qrImage,
  codigo,
  numero,
  categoria,
}: Props) {
  const [gerando, setGerando] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);

  const nome = obterNome(categoria);
  const numeroFormatado = String(numero).padStart(3, "0");

  async function gerarImagem() {
    const [fundo, qrCode] = await Promise.all([
      carregarImagem("/fundo-imprensa.png"),
      carregarImagem(qrImage),
    ]);

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

    // ======================================
    // FUNDO ORIGINAL
    // ======================================

    ctx.drawImage(fundo, 0, 0, largura, altura);

    // ======================================
    // CARTÃO BRANCO DO QR CODE
    // ======================================

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

    // ======================================
    // QR CODE CENTRALIZADO
    // ======================================

    const qrTamanho = cardLargura * 0.78;

    const qrX = centroX - qrTamanho / 2;
    const qrY = cardY + (cardAltura - qrTamanho) / 2;

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      qrCode,
      qrX,
      qrY,
      qrTamanho,
      qrTamanho
    );

    ctx.imageSmoothingEnabled = true;

    // ======================================
    // TEXTO DA CATEGORIA
    // ======================================

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fonte = largura * 0.043;

    ctx.font = `900 ${fonte}px Arial`;

    while (
      fonte > largura * 0.025 &&
      ctx.measureText(nome).width > largura * 0.76
    ) {
      fonte -= 2;
      ctx.font = `900 ${fonte}px Arial`;
    }

    const nomeY = altura * 0.914;

    ctx.lineJoin = "round";
    ctx.lineWidth = largura * 0.006;
    ctx.strokeStyle = "#4A0905";

    ctx.strokeText(nome, centroX, nomeY);

    ctx.fillStyle = "#FFD66B";
    ctx.fillText(nome, centroX, nomeY);

    // ======================================
    // NÚMERO DO QR CODE
    // ======================================

    const textoNumero = `QR CODE Nº ${numeroFormatado}`;
    const numeroY = altura * 0.955;

    ctx.font = `bold ${Math.round(largura * 0.029)}px Arial`;

    ctx.lineWidth = largura * 0.005;
    ctx.strokeStyle = "#4A0905";
    ctx.strokeText(textoNumero, centroX, numeroY);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(textoNumero, centroX, numeroY);

    return canvas.toDataURL("image/png");
  }

  async function obterImagem() {
    if (imagemGerada) {
      return imagemGerada;
    }

    setGerando(true);

    try {
      const imagem = await gerarImagem();
      setImagemGerada(imagem);
      return imagem;
    } catch (error) {
      console.error("Erro ao gerar ingresso:", error);
      alert("Não foi possível gerar o ingresso.");
      return null;
    } finally {
      setGerando(false);
    }
  }

  async function visualizarIngresso() {
    const imagem = await obterImagem();

    if (imagem) {
      setMostrarPrevia(true);
    }
  }

  async function baixarIngresso() {
    const imagem = await obterImagem();

    if (!imagem) return;

    const link = document.createElement("a");

    link.href = imagem;
    link.download = `INGRESSO-${codigo}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <>
      {/* BOTÕES */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={visualizarIngresso}
          disabled={gerando}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#F4C75D]/40 bg-[#F4C75D]/10 px-3 py-3 text-xs font-bold text-[#F4C75D] transition hover:bg-[#F4C75D]/20 disabled:opacity-50"
        >
          {gerando ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Eye size={17} />
          )}
          Visualizar
        </button>

        <button
          type="button"
          onClick={baixarIngresso}
          disabled={gerando}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-3 py-3 text-xs font-bold text-[#231A0A] transition hover:brightness-110 disabled:opacity-50"
        >
          {gerando ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Download size={17} />
          )}
          Baixar
        </button>
      </div>

      {/* PRÉVIA DO PNG REAL */}
      {mostrarPrevia && imagemGerada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="flex max-h-[95dvh] w-full max-w-md flex-col rounded-2xl border border-white/15 bg-[#141D25] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-white">
                {nome} — Nº {numeroFormatado}
              </p>

              <button
                type="button"
                onClick={() => setMostrarPrevia(false)}
                aria-label="Fechar prévia"
                className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X size={20} />
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagemGerada}
              alt={`Ingresso ${nome} ${numeroFormatado}`}
              className="mx-auto min-h-0 max-h-[75dvh] w-auto rounded-lg object-contain"
            />

            <button
              type="button"
              onClick={baixarIngresso}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-4 py-3 text-sm font-bold text-[#231A0A]"
            >
              <Download size={17} />
              Baixar ingresso
            </button>
          </div>
        </div>
      )}
    </>
  );
}
