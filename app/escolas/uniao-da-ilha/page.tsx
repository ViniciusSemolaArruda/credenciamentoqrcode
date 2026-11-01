
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Info,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const NUMEROS = Array.from({ length: 20 }, (_, i) => i + 1);

const API_INGRESSOS = "/api/escolas/uniao-da-ilha/ingressos";
const API_RETIRAR = "/api/escolas/uniao-da-ilha/retirar";

// ==========================================
// TIPOS
// ==========================================

type IngressoPublico = {
  numero: number;
  disponivel: boolean;
  retirado: boolean;
  utilizado: boolean;
  cancelado: boolean;
};

type IngressoRetirado = {
  numero: number;
  codigo: string;
  qrCode: string;
};

// ==========================================
// REGRAS
// ==========================================

const regras = [
  {
    icon: Ticket,
    titulo: "Um QR Code por pessoa",
    texto:
      "Após a retirada confirmada, o número fica indisponível para outras pessoas.",
  },
  {
    icon: Users,
    titulo: "Ingresso pessoal e intransferível",
    texto:
      "O participante deverá informar seus dados para a retirada.",
  },
  {
    icon: Mail,
    titulo: "Guarde seu ingresso",
    texto:
      "Após a retirada, baixe e guarde a imagem do seu QR Code. O envio por e-mail poderá ser realizado posteriormente pela organização.",
  },
  {
    icon: LockKeyhole,
    titulo: "Apenas uma entrada",
    texto:
      "Na portaria, o QR Code será validado e marcado como utilizado.",
  },
];

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function UniaoDaIlhaPage() {
  // POP-UPS
  const [boasVindasAbertas, setBoasVindasAbertas] =
    useState(true);

  const [regrasAbertas, setRegrasAbertas] =
    useState(false);

  const [concordou, setConcordou] = useState(false);

  // SELEÇÃO
  const [numero, setNumero] = useState<number | null>(null);
  const [formularioAberto, setFormularioAberto] =
    useState(false);

  // FORMULÁRIO
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [aviso, setAviso] = useState("");

  // INGRESSOS
  const [ingressos, setIngressos] =
    useState<IngressoPublico[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erroConsulta, setErroConsulta] = useState("");

  // RETIRADA
  const [enviando, setEnviando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");

  const [resultado, setResultado] =
    useState<IngressoRetirado | null>(null);

  // ==========================================
  // CONTADORES
  // ==========================================

  const retirados = ingressos
    .filter((item) => item.retirado)
    .map((item) => item.numero);

  const disponiveis = ingressos.filter(
    (item) => item.disponivel
  ).length;

  const total = ingressos.length;

  // ==========================================
  // CONSULTAR INGRESSOS NO NEON
  // ==========================================

  async function consultarIngressos(silencioso = false) {
    if (!silencioso) {
      setCarregando(true);
    } else {
      setAtualizando(true);
    }

    try {
      const resposta = await fetch(API_INGRESSOS, {
        cache: "no-store",
      });

      const dados = await resposta.json();

      if (
        !resposta.ok ||
        !dados.sucesso ||
        !Array.isArray(dados.ingressos)
      ) {
        throw new Error(
          dados.mensagem ||
            "Não foi possível carregar os ingressos."
        );
      }

      const lista = dados.ingressos as IngressoPublico[];

      setIngressos(lista);
      setErroConsulta("");

      setNumero((anterior) =>
        anterior !== null &&
        !lista.some(
          (item) =>
            item.numero === anterior && item.disponivel
        )
          ? null
          : anterior
      );
    } catch (erro) {
      setErroConsulta(
        erro instanceof Error
          ? erro.message
          : "Erro ao consultar ingressos."
      );

      setIngressos([]);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  // ==========================================
  // ATUALIZAÇÃO AUTOMÁTICA
  // ==========================================

  useEffect(() => {
    void consultarIngressos();

    const intervalo = window.setInterval(() => {
      void consultarIngressos(true);
    }, 15000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  // ==========================================
  // BLOQUEAR ROLAGEM COM MODAL ABERTO
  // ==========================================

  useEffect(() => {
    const modalAberto =
      boasVindasAbertas ||
      regrasAbertas ||
      formularioAberto ||
      Boolean(resultado);

    document.body.style.overflow = modalAberto
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    boasVindasAbertas,
    regrasAbertas,
    formularioAberto,
    resultado,
  ]);

  // ==========================================
  // CONTINUAR PARA AS REGRAS
  // ==========================================

  function continuarBoasVindas() {
    setBoasVindasAbertas(false);
    setRegrasAbertas(true);
  }

  // ==========================================
  // CONFIRMAR RETIRADA
  // ==========================================

  async function confirmarFormulario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (numero === null || enviando || resultado) {
      return;
    }

    setEnviando(true);
    setErroFormulario("");
    setAviso("");

    try {
      const resposta = await fetch(API_RETIRAR, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero,
          nomeCompleto: nome,
          email,
        }),
      });

      const dados = await resposta.json();

      if (
        !resposta.ok ||
        !dados.sucesso ||
        !dados.ingresso?.qrCode
      ) {
        throw new Error(
          dados.mensagem ||
            "Não foi possível retirar o ingresso."
        );
      }

      // Recebe o QR Code da API existente.
      // Não cria ingressos nem tokens no frontend.
      setResultado(
        dados.ingresso as IngressoRetirado
      );

      setFormularioAberto(false);
      setNome("");
      setEmail("");
      setNumero(null);

      setAviso(
        "Retirada confirmada! Salve seu QR Code antes de fechar esta janela."
      );

      await consultarIngressos(true);
    } catch (erro) {
      setErroFormulario(
        erro instanceof Error
          ? erro.message
          : "Erro ao retirar ingresso."
      );

      void consultarIngressos(true);
    } finally {
      setEnviando(false);
    }
  }

  // ==========================================
  // BAIXAR QR CODE RECEBIDO DA API
  // ==========================================

  function baixarQRCode() {
    if (!resultado) return;

    const link = document.createElement("a");

    link.href = resultado.qrCode;
    link.download = `QR-${resultado.codigo}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030913] text-white selection:bg-[#e9b95f]/30">

      {/* ======================================
          HERO RESPONSIVO
      ====================================== */}

      <section className="relative isolate flex min-h-[780px] flex-col overflow-hidden sm:min-h-[820px] lg:min-h-[820px]">

        {/* IMAGEM MOBILE */}
        <div className="absolute inset-0 -z-20 block sm:hidden">
          <Image
            src="/hero-uniao-ilha-mbile.png"
            alt="Bandeira da União da Ilha do Governador"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* IMAGEM DESKTOP */}
        <div className="absolute inset-0 -z-20 hidden sm:block">
          <Image
            src="/hero-uniao-ilha.png"
            alt="Bandeira da União da Ilha do Governador"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* SOMBREAMENTO */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#020814]/45 via-transparent via-[45%] to-[#030913] sm:from-[#020814]/45" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[48%] bg-gradient-to-t from-[#030913] via-[#030913]/60 to-transparent sm:h-[45%]" />

        {/* LOGO */}
        <div className="relative z-20 flex w-full justify-center px-3 pt-4 sm:px-4 sm:pt-5 lg:pt-2">
          <div className="relative h-[205px] w-[290px] max-w-full sm:h-[215px] sm:w-[310px] lg:h-[205px] lg:w-[290px]">
            <Image
              src="/logo-festival.png"
              alt="Festival Todo Mundo no Samba — Carnaval 2027 Série Ouro"
              fill
              priority
              sizes="(max-width: 639px) 290px, (max-width: 1023px) 310px, 290px"
              className="object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,.9)]"
            />
          </div>
        </div>

        {/* CONTEÚDO DO HERO */}
        <div className="relative z-10 mx-auto mt-auto flex w-full max-w-[1320px] flex-col items-center px-5 pb-20 pt-16 text-center sm:pb-24 lg:pb-24">

          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e8c275]/45 bg-[#04101d]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#f8d98f] backdrop-blur-md sm:text-xs sm:tracking-[.18em]">
            <Sparkles size={14} />
            Retirada oficial de ingressos
          </span>

          <h1 className="max-w-[850px] font-serif text-[38px] font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_5px_25px_#000] sm:text-[60px] lg:text-[62px]">
            União da Ilha
            <span className="block text-[#f7d48c]">
              do Governador
            </span>
          </h1>

          <p className="mt-5 max-w-[560px] text-sm leading-relaxed text-white/90 sm:text-base">
            Garanta seu lugar no Festival Todo Mundo no Samba.
            Escolha um dos 20 QR Codes exclusivos da escola.
          </p>

          <a
            href="#cartela"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#f9dc99] via-[#f2c369] to-[#d9a34a] px-7 py-4 text-xs font-extrabold uppercase tracking-wider text-[#221508] shadow-[0_8px_30px_rgba(234,179,75,.25)] transition hover:-translate-y-1 hover:brightness-110"
          >
            Escolher meu QR Code
            <ArrowDown size={18} />
          </a>
        </div>
      </section>

      {/* ======================================
          INFORMAÇÕES DO EVENTO
      ====================================== */}

      <section className="relative z-10 -mt-8 px-4 sm:-mt-10">
        <div className="mx-auto grid max-w-[1050px] grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#e8bd6c]/30 bg-[#d9ad5c]/20 shadow-[0_15px_50px_rgba(0,0,0,.35)] sm:grid-cols-3">
          {[
            {
              rotulo: "Evento",
              valor: "Festival Todo Mundo no Samba",
            },
            {
              rotulo: "Edição",
              valor: "Carnaval 2027 · Série Ouro",
            },
            {
              rotulo: "Escola",
              valor: "União da Ilha do Governador",
            },
          ].map((item) => (
            <div
              key={item.rotulo}
              className="bg-[#081827]/95 px-5 py-5 text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#dcb468]">
                {item.rotulo}
              </p>

              <p className="mt-1.5 text-sm font-medium text-white/90">
                {item.valor}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================
          CORPO DO SITE
      ====================================== */}

      <div className="relative isolate overflow-hidden pb-16 pt-16 sm:pt-24">

        <div className="pointer-events-none absolute inset-0 -z-20 bg-[#030913]" />

        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-75"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #030913 0%, rgba(3,9,19,.5) 23%, rgba(3,9,19,.5) 77%, #030913 100%), url('/fundo-cartela.png')",
            backgroundPosition: "center top",
            backgroundSize: "cover",
          }}
        />

        <div className="pointer-events-none absolute left-1/2 top-12 -z-10 h-[500px] w-[750px] max-w-full -translate-x-1/2 rounded-full bg-[#b17b35]/10 blur-[110px]" />

        {/* ======================================
            CARTELA DOS 20 QR CODES
        ====================================== */}

        <section
          id="cartela"
          className="mx-auto w-full max-w-[1100px] scroll-mt-8 px-3 sm:px-6"
        >

          {/* TÍTULO */}
          <div className="mb-9 text-center">

            <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-[#f3c877] to-transparent" />

            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#f2c674] sm:text-xs">
              Sua entrada começa aqui
            </p>

            <h2 className="mt-3 font-serif text-[32px] font-bold leading-tight text-[#f9d992] sm:text-[52px]">
              Escolha seu QR Code
            </h2>

            <p className="mx-auto mt-3 max-w-[570px] text-sm leading-relaxed text-white/70">
              São apenas 20 ingressos exclusivos.
              Selecione um número disponível para iniciar sua retirada.
            </p>

          </div>

          {/* CARD PRINCIPAL */}
          <div className="overflow-hidden rounded-[26px] border border-[#e3b660]/50 bg-[#051321]/90 p-4 shadow-[0_30px_100px_rgba(0,0,0,.65)] backdrop-blur-2xl sm:p-8 lg:p-10">

            {/* CONTADORES */}
            <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">

              {[
                {
                  valor: total,
                  titulo: "Total de ingressos",
                },
                {
                  valor: disponiveis,
                  titulo: "Disponíveis",
                },
                {
                  valor: retirados.length,
                  titulo: "Retirados",
                },
              ].map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-xl border border-white/10 bg-gradient-to-b from-[#142b3d]/90 to-[#091a2a]/90 px-1 py-4 text-center sm:py-6"
                >
                  <p className="font-serif text-3xl font-bold text-[#f5ce7c] sm:text-4xl">
                    {item.valor}
                  </p>

                  <p className="mt-1.5 text-[9px] uppercase tracking-wide text-white/60 sm:text-xs">
                    {item.titulo}
                  </p>
                </div>
              ))}

            </div>

            {/* LEGENDA */}
            <div className="mb-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-white/75 sm:text-xs">

              <span className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Disponível
              </span>

              <span className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Retirado
              </span>

              <span className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-[#f4c66c]" />
                Selecionado
              </span>

            </div>

            {/* ATUALIZAR DISPONIBILIDADE */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-3 text-center text-xs">

              {carregando && (
                <span className="text-[#f5ce7c]">
                  Carregando ingressos...
                </span>
              )}

              {atualizando && (
                <span className="text-white/50">
                  Atualizando...
                </span>
              )}

              <button
                type="button"
                disabled={carregando || atualizando}
                onClick={() => void consultarIngressos(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-white/80 hover:border-[#f5ce7c] disabled:opacity-40"
              >
                <RefreshCw size={14} />
                Atualizar disponibilidade
              </button>

            </div>

            {erroConsulta && (
              <p
                role="alert"
                className="mb-5 rounded-xl border border-rose-400/40 bg-rose-950/40 p-4 text-center text-sm text-rose-100"
              >
                {erroConsulta}
              </p>
            )}

            {/* ======================================
                GRID COM 20 NÚMEROS
            ====================================== */}

            <div className="grid grid-cols-5 gap-1.5 sm:gap-3">

              {NUMEROS.map((n) => {
                const item = ingressos.find(
                  (ingresso) => ingresso.numero === n
                );

                const retirado = item
                  ? !item.disponivel
                  : false;

                const bloqueado =
                  carregando ||
                  !!erroConsulta ||
                  !item ||
                  retirado;

                const escolhido =
                  numero === n && !bloqueado;

                return (
                  <button
                    key={n}
                    type="button"
                    disabled={bloqueado}
                    aria-pressed={escolhido}
                    aria-label={`QR Code ${n}: ${
                      bloqueado
                        ? "indisponível"
                        : escolhido
                        ? "selecionado"
                        : "disponível"
                    }`}
                    onClick={() => {
                      setNumero(n);
                      setAviso("");
                    }}
                    className={`relative flex min-h-[76px] flex-col items-center justify-center rounded-xl border transition duration-200 sm:min-h-[105px] ${
                      bloqueado
                        ? "cursor-not-allowed border-rose-500/60 bg-gradient-to-b from-[#481921] to-[#270f18] text-rose-200"
                        : escolhido
                        ? "scale-[1.02] border-[#ffe9ad] bg-gradient-to-b from-[#f9dd9d] to-[#c9943d] text-[#241604] shadow-[0_0_30px_rgba(240,193,100,.3)]"
                        : "border-emerald-400/65 bg-gradient-to-b from-[#07533e] to-[#063126] text-white hover:-translate-y-1 hover:border-emerald-300 hover:brightness-110"
                    }`}
                  >

                    {bloqueado && !carregando && (
                      <LockKeyhole
                        size={12}
                        className="absolute right-1.5 top-1.5 text-rose-300 sm:right-3 sm:top-3"
                      />
                    )}

                    {escolhido && (
                      <Check
                        size={14}
                        className="absolute right-1.5 top-1.5 sm:right-3 sm:top-3"
                      />
                    )}

                    <span className="font-serif text-2xl font-bold leading-none sm:text-[35px]">
                      {String(n).padStart(2, "0")}
                    </span>

                    <span className="mt-2 text-[8px] font-medium sm:text-xs">
                      {carregando
                        ? "Carregando"
                        : bloqueado
                        ? item?.retirado
                          ? "Retirado"
                          : "Indisponível"
                        : escolhido
                        ? "Selecionado"
                        : "Disponível"}
                    </span>

                  </button>
                );
              })}

            </div>

            {/* BOTÃO CONTINUAR */}
            <button
              type="button"
              disabled={
                numero === null ||
                carregando ||
                !!erroConsulta
              }
              onClick={() => setFormularioAberto(true)}
              className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f8d993] via-[#efc26a] to-[#d8a34e] px-3 text-center text-[11px] font-extrabold uppercase tracking-wide text-[#211508] shadow-[0_8px_35px_rgba(233,175,70,.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
            >
              <Download size={17} />

              {numero === null
                ? "Selecione um QR Code"
                : `Continuar com o QR Code ${String(
                    numero
                  ).padStart(2, "0")}`}

              <ArrowRight size={17} />
            </button>

            <p className="mt-3 text-center text-[11px] text-white/45">
              Os números são consultados no Neon.
              Cada ingresso pode ser retirado apenas uma vez.
            </p>

            {aviso && (
              <p
                role="status"
                className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-center text-sm text-amber-100"
              >
                {aviso}
              </p>
            )}

          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="mx-auto mt-16 max-w-[1100px] border-t border-[#e1b65e]/20 px-5 pt-7 text-center">

          <p className="text-xs uppercase tracking-[.2em] text-[#e4bf79]">
            Festival Todo Mundo no Samba
          </p>

          <p className="mt-2 text-xs text-white/45">
            Carnaval 2027 · Série Ouro · União da Ilha do Governador
          </p>

          <Link
            href="/politica-de-privacidade"
            className="mt-4 inline-block text-xs text-[#f0c775] underline underline-offset-4 hover:text-white"
          >
            Política de Privacidade
          </Link>

        </footer>

      </div>

      {/* ======================================
          POP-UP DE BOAS-VINDAS
      ====================================== */}

      {boasVindasAbertas && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#02060d]/85 p-4 backdrop-blur-[8px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-boas-vindas"
        >

          <div className="my-auto w-full max-w-[475px] overflow-hidden rounded-[26px] border border-[#e8bd6c]/75 bg-gradient-to-b from-[#0b1d2d] to-[#040c16] p-6 text-center shadow-[0_30px_120px_#000] sm:p-8">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#eac57a]/50 bg-[#f0c876]/10 text-[#f4d58d]">
              <Sparkles size={31} />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e8bd6c]">
              Festival Todo Mundo no Samba
            </p>

            <h2
              id="titulo-boas-vindas"
              className="mt-4 font-serif text-[27px] font-bold leading-tight text-[#f9d68b] sm:text-[32px]"
            >
              Olá, G.R.E.S.
              <span className="mt-1 block">
                UNIÃO DA ILHA!
              </span>
            </h2>

            <p className="mt-5 text-[15px] leading-relaxed text-white/90">
              Você é nosso{" "}
              <span className="font-bold text-[#f9d68b]">
                convidado especial
              </span>{" "}
              para o{" "}
              <span className="font-bold">
                Festival Todo Mundo no Samba!
              </span>
            </p>

            <p className="mt-4 text-sm leading-relaxed text-white/65">
              É uma alegria receber a União da Ilha do
              Governador nesta grande celebração da nossa
              cultura, tradição e paixão pelo samba.
            </p>

            <p className="mt-5 font-serif text-lg font-bold text-[#f9d68b]">
              Obrigado por fazer parte dessa história!
            </p>

            <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#f3c877] to-transparent" />

            <p className="mt-5 text-xs leading-relaxed text-white/50">
              Preparamos 20 ingressos exclusivos para a
              sua escola. Antes de escolher o seu, confira
              as orientações de retirada.
            </p>

            <button
              type="button"
              onClick={continuarBoasVindas}
              className="mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f8dc9b] to-[#dca54c] text-sm font-extrabold uppercase tracking-wide text-[#241708] transition hover:brightness-110"
            >
              Continuar
              <ArrowRight size={18} />
            </button>

          </div>
        </div>
      )}

      {/* ======================================
          POP-UP OBRIGATÓRIO DE REGRAS
      ====================================== */}

      {regrasAbertas && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#02060d]/75 p-3 backdrop-blur-[7px] sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-regras"
        >

          <div className="my-auto w-full max-w-[475px] rounded-[24px] border border-[#e8bd6c]/75 bg-gradient-to-b from-[#0b1d2d] to-[#040c16] p-5 shadow-[0_30px_120px_#000] sm:p-7">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#eac57a]/60 bg-[#f0c876]/10 text-[#f4d58d]">
              <Info size={26} />
            </div>

            <h2
              id="titulo-regras"
              className="text-center font-serif text-2xl font-bold uppercase text-[#f9d68b]"
            >
              Regras do seu QR Code
            </h2>

            <p className="mb-6 mt-1 text-center text-xs text-white/65">
              Leia com atenção antes de acessar a cartela.
            </p>

            <div className="space-y-2.5">

              {regras.map(
                ({ icon: Icon, titulo, texto }) => (
                  <div
                    key={titulo}
                    className="flex gap-3 rounded-xl border border-white/10 bg-[#132638]/75 p-3"
                  >
                    <Icon
                      size={23}
                      className="mt-0.5 shrink-0 text-[#f1c775]"
                    />

                    <div>
                      <p className="text-xs font-semibold text-white">
                        {titulo}
                      </p>

                      <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                        {texto}
                      </p>
                    </div>
                  </div>
                )
              )}

            </div>

            <label className="mt-6 flex cursor-pointer items-center gap-3 text-xs text-white/90">
              <input
                type="checkbox"
                checked={concordou}
                onChange={(e) =>
                  setConcordou(e.target.checked)
                }
                className="h-5 w-5 shrink-0 accent-[#edc16b]"
              />

              Li e concordo com as regras acima.
            </label>

            <button
              type="button"
              disabled={!concordou}
              onClick={() => setRegrasAbertas(false)}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f8dc9b] to-[#dca54c] text-sm font-extrabold uppercase text-[#241708] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Entrar na cartela
              <ArrowRight size={17} />
            </button>

          </div>
        </div>
      )}

      {/* ======================================
          QR CODE APÓS RETIRADA CONFIRMADA
      ====================================== */}

      {resultado && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#02060d]/90 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-qr-confirmado"
        >

          <div className="my-auto w-full max-w-[470px] rounded-[24px] border border-[#e8bd6c]/70 bg-gradient-to-b from-[#0b1d2d] to-[#040c16] p-6 text-center shadow-[0_30px_120px_#000]">

            <CheckCircle2
              size={42}
              className="mx-auto mb-3 text-emerald-400"
            />

            <h2
              id="titulo-qr-confirmado"
              className="font-serif text-2xl font-bold text-[#f8d58b]"
            >
              Ingresso confirmado!
            </h2>

            <p className="mt-2 text-sm text-white/75">
              QR Code {String(resultado.numero).padStart(2, "0")}
              {" · "}
              {resultado.codigo}
            </p>

            <div className="mx-auto mt-5 w-fit rounded-xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultado.qrCode}
                alt={`QR Code do ingresso ${resultado.numero}`}
                width={280}
                height={280}
                className="h-[280px] w-[280px] max-w-full"
              />
            </div>

            <p className="mt-4 text-xs leading-relaxed text-amber-100">
              Baixe e guarde seu QR Code agora.
              A organização também poderá encaminhá-lo
              posteriormente ao e-mail informado.
            </p>

            <button
              type="button"
              onClick={baixarQRCode}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f8dc9b] to-[#dca54c] font-bold text-[#241708] hover:brightness-110"
            >
              <Download size={18} />
              Baixar meu QR Code
            </button>

            <button
              type="button"
              onClick={() => {
                setResultado(null);
                setAviso("");
              }}
              className="mt-3 w-full rounded-xl border border-white/20 py-3 text-sm text-white/80 hover:border-white/50"
            >
              Já salvei meu ingresso — fechar
            </button>

          </div>
        </div>
      )}

      {/* ======================================
          FORMULÁRIO DE RETIRADA
          COM AVISO DE PRIVACIDADE LGPD
      ====================================== */}

      {formularioAberto && numero !== null && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#02060d]/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-retirada"
        >

          <div className="my-auto w-full max-w-[460px] rounded-[24px] border border-[#e8bd6c]/70 bg-gradient-to-b from-[#0b1d2d] to-[#040c16] p-6 shadow-[0_30px_120px_#000]">

            <button
              type="button"
              disabled={enviando}
              onClick={() => {
                setFormularioAberto(false);
                setErroFormulario("");
              }}
              aria-label="Fechar"
              className="ml-auto flex text-white/65 hover:text-white"
            >
              <X size={22} />
            </button>

            <div className="mb-3 flex justify-center text-[#f4d58d]">
              <ShieldCheck size={42} />
            </div>

            <h2
              id="titulo-retirada"
              className="text-center font-serif text-3xl font-bold text-[#f8d58b]"
            >
              QR Code {String(numero).padStart(2, "0")}
            </h2>

            <p className="mb-6 mt-2 text-center text-sm text-white/65">
              Informe seus dados para continuar.
            </p>

            <form
              onSubmit={confirmarFormulario}
              className="space-y-4"
            >

              {/* NOME */}
              <label className="block text-xs font-semibold text-white/80">
                Nome completo

                <input
                  disabled={enviando}
                  required
                  minLength={3}
                  maxLength={150}
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  placeholder="Seu nome completo"
                  className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#112738] px-4 text-base text-white outline-none focus:border-[#f0c26d]"
                />
              </label>

              {/* E-MAIL */}
              <label className="block text-xs font-semibold text-white/80">
                E-mail

                <input
                  disabled={enviando}
                  required
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="seuemail@exemplo.com"
                  className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#112738] px-4 text-base text-white outline-none focus:border-[#f0c26d]"
                />
              </label>

              {/* ======================================
                  AVISO DE PRIVACIDADE — LGPD
              ====================================== */}

              <div className="rounded-xl border border-[#e8bd6c]/30 bg-[#e8bd6c]/5 p-4">

                <div className="flex items-start gap-3">

                  <ShieldCheck
                    size={21}
                    className="mt-0.5 shrink-0 text-[#f0c775]"
                  />

                  <div>
                    <p className="text-xs font-bold text-[#f9d68b]">
                      Privacidade dos seus dados
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-white/70">
                      A G.R.E.S. Guardiões da Capadócia
                      utilizará seu nome e e-mail para
                      registrar sua retirada, identificar
                      o titular do ingresso e possibilitar
                      o envio do QR Code por e-mail.
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-white/70">
                      Seus dados serão tratados conforme
                      nossa{" "}
                      <Link
                        href="/politica-de-privacidade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#f0c775] underline underline-offset-2 hover:text-white"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </p>

                    <p className="mt-2 text-[11px] leading-relaxed text-white/50">
                      Os dados informados para a retirada
                      não serão utilizados automaticamente
                      para o envio de publicidade.
                    </p>
                  </div>

                </div>
              </div>

              {/* ERRO */}
              {erroFormulario && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-400/40 bg-rose-950/40 p-3 text-sm text-rose-100"
                >
                  {erroFormulario}
                </p>
              )}

              {/* CONFIRMAR */}
              <button
                type="submit"
                disabled={enviando}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f8dc9b] to-[#dca54c] font-bold text-[#241708] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {enviando ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={18} />
                )}

                {enviando
                  ? "Confirmando..."
                  : "Confirmar retirada"}
              </button>

            </form>

          </div>
        </div>
      )}

    </main>
  );
}
