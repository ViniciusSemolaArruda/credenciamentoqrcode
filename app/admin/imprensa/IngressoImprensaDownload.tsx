
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

type Props = {
  qrImage: string;
  codigo: string;
  numero: number;
  veiculo: string;
};

// ==========================================
// CARREGAR IMAGEM
// ==========================================

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new window.Image();

    imagem.onload = () => resolve(imagem);

    imagem.onerror = () => {
      reject(new Error(`Erro ao carregar imagem: ${src}`));
    };

    imagem.src = src;
  });
}

// ==========================================
// DESENHAR RETÂNGULO ARREDONDADO
// ==========================================

function retanguloArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  largura: number,
  altura: number,
  raio: number
) {
  const r = Math.min(raio, largura / 2, altura / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);

  ctx.lineTo(x + largura - r, y);
  ctx.quadraticCurveTo(
    x + largura,
    y,
    x + largura,
    y + r
  );

  ctx.lineTo(x + largura, y + altura - r);
  ctx.quadraticCurveTo(
    x + largura,
    y + altura,
    x + largura - r,
    y + altura
  );

  ctx.lineTo(x + r, y + altura);
  ctx.quadraticCurveTo(
    x,
    y + altura,
    x,
    y + altura - r
  );

  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);

  ctx.closePath();
}

// ==========================================
// COMPONENTE
// ==========================================

export default function IngressoImprensaDownload({
  qrImage,
  codigo,
  numero,
  veiculo,
}: Props) {
  const [baixando, setBaixando] = useState(false);

  async function baixarIngresso() {
    if (baixando) return;

    setBaixando(true);

    try {
      // ======================================
      // CARREGAR FUNDO E QR CODE
      // ======================================

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
      // FUNDO ORIGINAL DO FESTIVAL
      // ======================================

      ctx.drawImage(
        fundo,
        0,
        0,
        largura,
        altura
      );

      // ======================================
      // CARTÃO BRANCO ARREDONDADO
      // ======================================

      const cardLargura = largura * 0.56;
      const cardAltura = altura * 0.405;

      const cardX = centroX - cardLargura / 2;
      const cardY = altura * 0.47;

      const raio = largura * 0.075;

      // Sombra suave.
      ctx.save();

      ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
      ctx.shadowBlur = largura * 0.025;
      ctx.shadowOffsetY = altura * 0.008;

      ctx.fillStyle = "#FFFFFF";

      retanguloArredondado(
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
      const qrY = cardY + cardAltura * 0.065;

      // Fundo branco para leitura.
      ctx.fillStyle = "#FFFFFF";

      ctx.fillRect(
        qrX,
        qrY,
        qrTamanho,
        qrTamanho
      );

      // Mantém os pixels do QR Code nítidos.
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
      // BOTÃO VERMELHO "SCAN HERE"
      // ======================================

      const botaoLargura = cardLargura * 0.44;
      const botaoAltura = cardAltura * 0.075;

      const botaoX = centroX - botaoLargura / 2;

      const botaoY =
        cardY + cardAltura * 0.865;

      ctx.fillStyle = "#AE290E";

      retanguloArredondado(
        ctx,
        botaoX,
        botaoY,
        botaoLargura,
        botaoAltura,
        botaoAltura / 2
      );

      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = `bold ${Math.round(
        largura * 0.025
      )}px Arial`;

      ctx.fillText(
        "Scan Here",
        centroX,
        botaoY + botaoAltura / 2
      );

      // ======================================
      // NOME DO VEÍCULO
      // ======================================

      const nomeVeiculo =
        veiculo.toLocaleUpperCase("pt-BR");

      const nomeY = altura * 0.914;

      let tamanhoFonte = largura * 0.043;

      ctx.font = `900 ${tamanhoFonte}px Arial`;

      while (
        tamanhoFonte > largura * 0.02 &&
        ctx.measureText(nomeVeiculo).width >
          largura * 0.74
      ) {
        tamanhoFonte -= 2;
        ctx.font = `900 ${tamanhoFonte}px Arial`;
      }

      // Contorno para legibilidade.
      ctx.lineJoin = "round";
      ctx.lineWidth = largura * 0.006;
      ctx.strokeStyle = "#4A0905";

      ctx.strokeText(
        nomeVeiculo,
        centroX,
        nomeY
      );

      ctx.fillStyle = "#FFD66B";

      ctx.fillText(
        nomeVeiculo,
        centroX,
        nomeY
      );

      // ======================================
      // NÚMERO DO QR CODE
      // ======================================

      const numeroFormatado = String(
        numero
      ).padStart(2, "0");

      const textoNumero =
        `QR CODE Nº ${numeroFormatado}`;

      const numeroY = altura * 0.955;

      ctx.font = `bold ${Math.round(
        largura * 0.029
      )}px Arial`;

      ctx.lineWidth = largura * 0.005;
      ctx.strokeStyle = "#4A0905";

      ctx.strokeText(
        textoNumero,
        centroX,
        numeroY
      );

      ctx.fillStyle = "#FFFFFF";

      ctx.fillText(
        textoNumero,
        centroX,
        numeroY
      );

      // ======================================
      // GERAR ARQUIVO PNG
      // ======================================

      const blob = await new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (resultado) => {
              if (resultado) {
                resolve(resultado);
              } else {
                reject(
                  new Error("Erro ao gerar PNG.")
                );
              }
            },
            "image/png"
          );
        }
      );

      // ======================================
      // DOWNLOAD
      // ======================================

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `INGRESSO-IMPRENSA-${codigo}.png`;

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        "Erro ao gerar ingresso:",
        error
      );

      alert(
        "Não foi possível baixar o ingresso. Tente novamente."
      );
    } finally {
      setBaixando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={baixarIngresso}
      disabled={baixando}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-4 py-3 text-sm font-bold text-[#231A0A] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
    >
      {baixando ? (
        <>
          <Loader2
            size={17}
            className="animate-spin"
          />
          Gerando ingresso...
        </>
      ) : (
        <>
          <Download size={17} />
          Baixar ingresso
        </>
      )}
    </button>
  );
}
