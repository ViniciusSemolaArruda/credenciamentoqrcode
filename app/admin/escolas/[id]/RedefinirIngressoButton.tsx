
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  RotateCcw,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type Props = {
  ingressoId: string;
  codigo: string;
};

export default function RedefinirIngressoButton({
  ingressoId,
  codigo,
}: Props) {
  const router = useRouter();

  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function redefinir() {
    if (carregando) return;

    if (motivo.trim().length < 5) {
      setErro(
        "Informe uma justificativa com pelo menos 5 caracteres."
      );
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch(
        `/api/admin/ingressos/${encodeURIComponent(ingressoId)}/redefinir`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            motivo: motivo.trim(),
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível redefinir o ingresso."
        );
      }

      setSucesso(true);
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado."
      );
    } finally {
      setCarregando(false);
    }
  }

  function fechar() {
    if (carregando) return;

    setAberto(false);
    setMotivo("");
    setErro("");
    setSucesso(false);
  }

  return (
    <>
      {/* BOTÃO DE REDEFINIÇÃO */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#F4C75D]/35 bg-[#F4C75D]/10 px-4 py-3 text-sm font-semibold text-[#F4C75D] transition hover:bg-[#F4C75D]/20"
      >
        <RotateCcw size={16} />
        Tornar disponível novamente
      </button>

      {/* MODAL DE CONFIRMAÇÃO */}
      {aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`redefinir-${ingressoId}`}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#141D25] p-5 text-white shadow-2xl"
          >
            {!sucesso ? (
              <>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F4C75D]/20 bg-[#F4C75D]/10">
                    <AlertTriangle
                      size={23}
                      className="text-[#F4C75D]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={fechar}
                    disabled={carregando}
                    aria-label="Fechar"
                    className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h2
                  id={`redefinir-${ingressoId}`}
                  className="text-xl font-bold"
                >
                  Redefinir ingresso?
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  O ingresso{" "}
                  <strong className="text-white">
                    {codigo}
                  </strong>{" "}
                  voltará para o status disponível e
                  poderá ser utilizado novamente.
                </p>

                <div className="mt-5">
                  <label
                    htmlFor={`motivo-${ingressoId}`}
                    className="mb-2 block text-xs font-semibold text-white/75"
                  >
                    Motivo da redefinição
                  </label>

                  <textarea
                    id={`motivo-${ingressoId}`}
                    value={motivo}
                    onChange={(event) => {
                      setMotivo(event.target.value);
                      setErro("");
                    }}
                    maxLength={500}
                    rows={3}
                    disabled={carregando}
                    placeholder="Ex.: Teste de credenciamento"
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#080F15] p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#F4C75D]/60"
                  />

                  <p className="mt-1 text-right text-[10px] text-white/35">
                    {motivo.length}/500
                  </p>
                </div>

                {erro && (
                  <p
                    role="alert"
                    className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
                  >
                    {erro}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={fechar}
                    disabled={carregando}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white/70"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={redefinir}
                    disabled={
                      carregando ||
                      motivo.trim().length < 5
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-3 py-3 text-sm font-bold text-[#231A0A] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {carregando ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Aguarde
                      </>
                    ) : (
                      <>
                        <RotateCcw size={16} />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2
                    size={34}
                    className="text-emerald-400"
                  />
                </div>

                <h2
                  id={`redefinir-${ingressoId}`}
                  className="text-xl font-bold"
                >
                  Ingresso disponível!
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  O QR Code já pode ser utilizado novamente.
                </p>

                <button
                  type="button"
                  onClick={fechar}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-4 py-3 text-sm font-bold text-[#231A0A]"
                >
                  Concluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
