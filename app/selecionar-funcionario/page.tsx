
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserRound,
  ArrowRight,
  Loader2,
  LogOut,
  Check,
  ShieldCheck,
} from "lucide-react";

type Funcionario = 1 | 2 | 3;

const FUNCIONARIOS = [1, 2, 3] as const;

export default function SelecionarFuncionarioPage() {
  const router = useRouter();

  const [funcionario, setFuncionario] =
    useState<Funcionario | null>(null);

  const [carregando, setCarregando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");

  // ==========================================
  // RECUPERAR FUNCIONÁRIO SELECIONADO
  // ==========================================

  useEffect(() => {
    const salvo = sessionStorage.getItem(
      "funcionarioSelecionado"
    );

    if (salvo === "1" || salvo === "2" || salvo === "3") {
      setFuncionario(Number(salvo) as Funcionario);
    }
  }, []);

  // ==========================================
  // CONTINUAR PARA CREDENCIAMENTO
  // ==========================================

  function continuar() {
    if (!funcionario || carregando || saindo) return;

    setCarregando(true);

    sessionStorage.setItem(
      "funcionarioSelecionado",
      String(funcionario)
    );

    router.push("/credenciamento");
  }

  // ==========================================
  // SAIR DA CONTA
  // ==========================================

  async function sair() {
    if (saindo || carregando) return;

    setSaindo(true);
    setErro("");

    try {
      const resposta = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!resposta.ok) {
        throw new Error("Falha ao encerrar a sessão.");
      }

      sessionStorage.removeItem(
        "funcionarioSelecionado"
      );

      router.replace("/login");
      router.refresh();
    } catch {
      setErro("Não foi possível sair. Tente novamente.");
      setSaindo(false);
    }
  }

  return (
    <main className="relative flex h-dvh w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-black px-4 py-3 text-white">

      {/* =====================================
          IMAGEM ORIGINAL COMO FUNDO
      ===================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/logo.png')",
        }}
      />

      {/* ESCURECIMENTO SUAVE */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/35"
      />

      {/* DEGRADÊ PARA LEGIBILIDADE */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45"
      />

      {/* =====================================
          CONTEÚDO CENTRAL
      ===================================== */}

      <div className="relative z-10 my-auto w-full max-w-[390px] py-2">

        {/* =====================================
            CARD DE VIDRO
        ===================================== */}

        <section className="relative overflow-hidden rounded-[28px] border border-white/30 bg-black/30 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">

          {/* REFLEXO SUPERIOR */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
          />

          {/* REFLEXO DECORATIVO */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative z-10">

            {/* =====================================
                CABEÇALHO
            ===================================== */}

            <header className="mb-5 text-center">

              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 shadow-inner backdrop-blur-md">
                <Users
                  size={22}
                  className="text-[#F4D58A]"
                />
              </div>

              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F4D58A]">
                Sistema de Credenciamento
              </p>

              <h1 className="text-[25px] font-bold tracking-tight text-white">
                Quem está trabalhando?
              </h1>

              <p className="mt-2 text-xs leading-relaxed text-white/75">
                Selecione seu identificador para iniciar
                o credenciamento.
              </p>
            </header>

            {/* =====================================
                SELEÇÃO DOS FUNCIONÁRIOS
            ===================================== */}

            <div className="space-y-2.5">
              {FUNCIONARIOS.map((numero) => {
                const selecionado =
                  funcionario === numero;

                return (
                  <button
                    key={numero}
                    type="button"
                    disabled={carregando || saindo}
                    onClick={() => {
                      setFuncionario(numero);
                      setErro("");
                    }}
                    aria-pressed={selecionado}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed ${
                      selecionado
                        ? "border-[#F4D58A] bg-[#F4D58A]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                        : "border-white/25 bg-white/10 hover:border-white/40 hover:bg-white/15"
                    }`}
                  >

                    {/* ÍCONE */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                        selecionado
                          ? "border-[#F4D58A]/50 bg-[#F4D58A] text-[#291B08]"
                          : "border-white/15 bg-black/25 text-white/80"
                      }`}
                    >
                      <UserRound
                        size={22}
                        strokeWidth={1.8}
                      />
                    </div>

                    {/* INFORMAÇÕES */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          selecionado
                            ? "text-[#F4D58A]"
                            : "text-white"
                        }`}
                      >
                        Funcionário {numero}
                      </p>

                      <p className="mt-0.5 text-[11px] text-white/65">
                        Operador de credenciamento
                      </p>
                    </div>

                    {/* INDICADOR */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                        selecionado
                          ? "border-[#F4D58A] bg-[#F4D58A] text-[#291B08]"
                          : "border-white/45 bg-white/5"
                      }`}
                    >
                      {selecionado && (
                        <Check
                          size={12}
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* =====================================
                ERRO
            ===================================== */}

            {erro && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-300/40 bg-red-950/60 px-3 py-3 text-xs text-red-100"
              >
                {erro}
              </div>
            )}

            {/* =====================================
                BOTÃO CONTINUAR
            ===================================== */}

            <button
              type="button"
              onClick={continuar}
              disabled={
                !funcionario ||
                carregando ||
                saindo
              }
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C8A45D] via-[#F4D58A] to-[#C8A45D] px-4 text-sm font-bold text-[#2A1B08] shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Carregando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* =====================================
                SAIR DA CONTA
            ===================================== */}

            <button
              type="button"
              onClick={sair}
              disabled={saindo || carregando}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.07] text-xs font-semibold text-white/85 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saindo ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Saindo...
                </>
              ) : (
                <>
                  <LogOut size={17} />
                  Sair da conta
                </>
              )}
            </button>

          </div>
        </section>

        {/* =====================================
            RODAPÉ
        ===================================== */}

        <footer className="mt-4 flex items-center justify-center gap-2 px-2 text-center text-[10px] text-white/85 drop-shadow-md">
          <ShieldCheck size={13} />
          Sua identificação será registrada em cada
          credenciamento.
        </footer>

      </div>
    </main>
  );
}
