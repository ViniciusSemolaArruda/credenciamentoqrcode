
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  LogOut,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const [confirmando, setConfirmando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");

  async function sair() {
    if (saindo) return;

    setSaindo(true);
    setErro("");

    try {
      const resposta = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!resposta.ok) {
        throw new Error("Erro ao encerrar sessão.");
      }

      sessionStorage.removeItem("funcionarioSelecionado");

      setConfirmando(false);

      router.replace("/login");
      router.refresh();
    } catch {
      setErro("Não foi possível sair. Tente novamente.");
      setSaindo(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErro("");
          setConfirmando(true);
        }}
        className="group flex min-h-[82px] w-full items-center gap-3 rounded-2xl border border-red-400/15 bg-[#141D25] p-4 text-left transition hover:border-red-400/35 hover:bg-[#211B22]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
          <LogOut
            size={21}
            className="text-red-400"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white">
            Sair da conta
          </h3>

          <p className="mt-1 text-[11px] leading-relaxed text-white/45">
            Encerrar sessão ou trocar de usuário
          </p>
        </div>

        <ChevronRight
          size={18}
          className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-red-400"
        />
      </button>

      {confirmando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-logout"
            className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#141D25] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
                <AlertTriangle
                  size={24}
                  className="text-[#F4C75D]"
                />
              </div>

              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={saindo}
                aria-label="Fechar"
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <h2
              id="titulo-logout"
              className="text-xl font-bold text-white"
            >
              Sair da conta?
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Sua sessão de administrador será encerrada.
              Você poderá entrar novamente como gerente ou
              utilizar uma conta de funcionário para realizar
              credenciamentos.
            </p>

            {erro && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300"
              >
                {erro}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={sair}
                disabled={saindo}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {saindo ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    Confirmar saída
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={saindo}
                className="min-h-[48px] w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
              >
                Continuar conectado
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
