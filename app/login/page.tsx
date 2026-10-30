
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type Perfil = "FUNCIONARIO" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil>("FUNCIONARIO");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const email =
    perfil === "ADMIN"
      ? "gerente@credenciamento.local"
      : "equipe@credenciamento.local";

  function selecionarPerfil(novoPerfil: Perfil) {
    if (carregando) return;

    setPerfil(novoPerfil);
    setSenha("");
    setErro("");
    setMostrarSenha(false);
  }

  async function fazerLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (carregando) return;

    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          senha,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        setErro(
          dados.mensagem ||
            "Senha incorreta. Tente novamente."
        );
        return;
      }

      if (dados.usuario?.role !== perfil) {
        setErro("Este usuário não possui essa permissão.");
        return;
      }

      if (perfil === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/selecionar-funcionario");
      }

      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="relative flex h-dvh w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-black px-4 py-3 text-white">

      {/* =====================================
          IMAGEM DE FUNDO - LOGO COMPLETA
      ===================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/logo.png')",
        }}
      />

      {/* CAMADA ESCURA PARA LEGIBILIDADE */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/35"
      />

      {/* DEGRADÊ SUAVE */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45"
      />

      {/* =====================================
          CARD DE VIDRO
      ===================================== */}

      <div className="relative z-10 my-auto w-full max-w-[390px] py-2">

        <section className="relative overflow-hidden rounded-[28px] border border-white/30 bg-black/30 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">

          {/* BRILHO NA BORDA SUPERIOR */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
          />

          {/* REFLEXO DO VIDRO */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative z-10">

            {/* CABEÇALHO */}
            <header className="mb-5 text-center">

              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 shadow-inner backdrop-blur-md">
                <LockKeyhole
                  size={21}
                  className="text-[#F4D58A]"
                />
              </div>

              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F4D58A]">
                Sistema de Credenciamento
              </p>

              <h1 className="text-[27px] font-bold tracking-tight text-white">
                Bem-vindo!
              </h1>

              <p className="mt-1 text-xs text-white/75">
                Selecione seu acesso para continuar
              </p>
            </header>

            {/* FORMULÁRIO */}
            <form onSubmit={fazerLogin}>

              {/* TIPO DE ACESSO */}
              <label className="mb-2 block text-xs font-semibold text-white/90">
                Tipo de acesso
              </label>

              <div className="mb-5 grid grid-cols-2 gap-3">

                {/* FUNCIONÁRIO */}
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() =>
                    selecionarPerfil("FUNCIONARIO")
                  }
                  aria-pressed={perfil === "FUNCIONARIO"}
                  className={`relative flex min-h-[94px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed ${
                    perfil === "FUNCIONARIO"
                      ? "border-[#F4D58A] bg-[#F4D58A]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "border-white/25 bg-white/10 hover:bg-white/15"
                  }`}
                >
                  {perfil === "FUNCIONARIO" && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#F4D58A] text-black">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}

                  <UserRound
                    size={25}
                    strokeWidth={1.7}
                    className={
                      perfil === "FUNCIONARIO"
                        ? "text-[#F4D58A]"
                        : "text-white/80"
                    }
                  />

                  <span
                    className={`text-xs font-semibold ${
                      perfil === "FUNCIONARIO"
                        ? "text-[#F4D58A]"
                        : "text-white/85"
                    }`}
                  >
                    Funcionário
                  </span>
                </button>

                {/* GERENTE */}
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() =>
                    selecionarPerfil("ADMIN")
                  }
                  aria-pressed={perfil === "ADMIN"}
                  className={`relative flex min-h-[94px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed ${
                    perfil === "ADMIN"
                      ? "border-[#F4D58A] bg-[#F4D58A]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "border-white/25 bg-white/10 hover:bg-white/15"
                  }`}
                >
                  {perfil === "ADMIN" && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#F4D58A] text-black">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}

                  <ShieldCheck
                    size={25}
                    strokeWidth={1.7}
                    className={
                      perfil === "ADMIN"
                        ? "text-[#F4D58A]"
                        : "text-white/80"
                    }
                  />

                  <span
                    className={`text-xs font-semibold ${
                      perfil === "ADMIN"
                        ? "text-[#F4D58A]"
                        : "text-white/85"
                    }`}
                  >
                    Gerente
                  </span>
                </button>
              </div>

              {/* SENHA */}
              <div className="mb-5">
                <label
                  htmlFor="senha"
                  className="mb-2 block text-xs font-semibold text-white/90"
                >
                  Senha de acesso
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/65"
                  />

                  <input
                    id="senha"
                    type={
                      mostrarSenha ? "text" : "password"
                    }
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      if (erro) setErro("");
                    }}
                    placeholder={
                      perfil === "ADMIN"
                        ? "Senha do gerente"
                        : "Senha do funcionário"
                    }
                    className="h-12 w-full rounded-xl border border-white/25 bg-black/30 pl-11 pr-12 text-base text-white outline-none transition placeholder:text-white/50 focus:border-[#F4D58A] focus:ring-2 focus:ring-[#F4D58A]/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha(!mostrarSenha)
                    }
                    aria-label={
                      mostrarSenha
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-white/75 hover:text-white"
                  >
                    {mostrarSenha ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* MENSAGEM DE ERRO */}
              {erro && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-300/40 bg-red-950/60 px-3 py-3 text-xs text-red-100"
                >
                  {erro}
                </div>
              )}

              {/* BOTÃO DE LOGIN */}
              <button
                type="submit"
                disabled={carregando || !senha.trim()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C8A45D] via-[#F4D58A] to-[#C8A45D] px-4 text-sm font-bold text-[#2A1B08] shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar como{" "}
                    {perfil === "ADMIN"
                      ? "Gerente"
                      : "Funcionário"}

                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] text-white/85 drop-shadow-md">
          <LockKeyhole size={12} />
          Acesso restrito aos profissionais autorizados
        </footer>
      </div>
    </main>
  );
}
