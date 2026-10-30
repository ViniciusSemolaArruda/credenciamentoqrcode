
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LockKeyholeOpen,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";

type Props = {
  bloqueado: boolean;
  tentativas: number;
};

export default function DesbloquearPinButton({
  bloqueado,
  tentativas,
}: Props) {
  const router = useRouter();

  const [modalAberto, setModalAberto] =
    useState(false);
  const [carregando, setCarregando] =
    useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const podeReiniciar =
    bloqueado || tentativas > 0;

  async function confirmarDesbloqueio() {
    if (carregando) return;

    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(
        "/api/admin/seguranca/desbloquear",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
            "Não foi possível reiniciar o PIN."
        );
      }

      setModalAberto(false);
      setSucesso(
        "Controle do PIN reiniciado com sucesso."
      );

      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao reiniciar o PIN."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErro("");
          setSucesso("");
          setModalAberto(true);
        }}
        disabled={!podeReiniciar || carregando}
        className="flex min-h-[49px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFE18A] to-[#DDA73F] px-4 py-3 text-sm font-bold text-[#261A08] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <LockKeyholeOpen size={18} />
        {bloqueado
          ? "Desbloquear PIN"
          : "Reiniciar tentativas"}
      </button>

      {sucesso && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200"
        >
          <ShieldCheck size={16} />
          {sucesso}
        </div>
      )}

      {erro && !modalAberto && (
        <p
          role="alert"
          className="mt-3 text-xs text-red-300"
        >
          {erro}
        </p>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-desbloqueio"
            className="w-full max-w-sm rounded-[22px] border border-white/10 bg-[#141D25] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4C75D]/10 text-[#F4C75D]">
                <LockKeyholeOpen size={24} />
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={carregando}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/10"
              >
                <X size={19} />
              </button>
            </div>

            <h2
              id="titulo-desbloqueio"
              className="mt-4 text-xl font-bold"
            >
              {bloqueado
                ? "Desbloquear PIN?"
                : "Reiniciar tentativas?"}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Esta ação apagará a contagem atual de
              erros e removerá o bloqueio temporário.
              O histórico de tentativas será preservado.
            </p>

            <p className="mt-3 text-xs leading-relaxed text-amber-200/80">
              Isso não libera nenhum ingresso.
              Seu PIN continuará sendo exigido
              para autorizar uma nova entrada.
            </p>

            {erro && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200"
              >
                {erro}
              </p>
            )}

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={confirmarDesbloqueio}
                disabled={carregando}
                className="flex min-h-[49px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFE18A] to-[#DDA73F] px-4 text-sm font-bold text-[#261A08] disabled:opacity-50"
              >
                {carregando ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <ShieldCheck size={18} />
                )}
                Confirmar
              </button>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={carregando}
                className="flex min-h-[47px] w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm text-white/80"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
