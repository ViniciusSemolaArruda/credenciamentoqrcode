
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";

import {
  ArrowLeft,
  ArrowRight,
  Ticket,
  Crown,
  CheckCircle2,
  Clock3,
  XCircle,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// CONFIGURAÇÃO DAS CATEGORIAS
// ==========================================

const categorias = [
  {
    id: "PRESIDENCIA" as const,
    nome: "Presidência",
    descricao: "Ingressos individuais da Presidência",
    icone: Crown,
  },
  {
    id: "PISTA" as const,
    nome: "Pista",
    descricao: "Ingressos individuais de Pista",
    icone: Ticket,
  },
];

// ==========================================
// CONTEÚDO PRINCIPAL
// ==========================================

async function IngressosIndividuaisConteudo() {
  // Somente administradores podem acessar.
  await requireRole("ADMIN");

  // Buscar os ingressos cadastrados no PostgreSQL.
  const ingressos =
    await prisma.ingressoConvidado.findMany({
      select: {
        id: true,
        categoria: true,
        status: true,
      },
    });

  // ==========================================
  // ESTATÍSTICAS GERAIS
  // ==========================================

  const totalIngressos = ingressos.length;

  const totalDisponiveis = ingressos.filter(
    (ingresso) => ingresso.status === "DISPONIVEL"
  ).length;

  const totalUtilizados = ingressos.filter(
    (ingresso) => ingresso.status === "UTILIZADO"
  ).length;

  const totalCancelados = ingressos.filter(
    (ingresso) => ingresso.status === "CANCELADO"
  ).length;

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={5000} />

      {/* EFEITO DE FUNDO */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">

        {/* ======================================
            HEADER PADRÃO
        ====================================== */}

        <header className="mb-6 flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0">
            <Image
              src="/logonova.png"
              alt="Guardiões da Capadócia"
              fill
              priority
              sizes="44px"
              className="object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-[19px] font-bold tracking-tight">
              Ingressos Individuais
            </h1>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

              <p className="text-[11px] text-white/45">
                Dados atualizados automaticamente
              </p>
            </div>
          </div>
        </header>

        {/* VOLTAR */}

        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#F4C75D] transition hover:text-[#FFE08A]"
        >
          <ArrowLeft size={16} />
          Voltar ao painel
        </Link>

        {/* ======================================
            IDENTIFICAÇÃO
        ====================================== */}

        <section className="mb-6 rounded-2xl border border-[#F4C75D]/20 bg-gradient-to-br from-[#25251D] to-[#141D25] p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#F4C75D]/20 bg-[#F4C75D]/10">
            <ShieldCheck
              size={23}
              className="text-[#F4C75D]"
            />
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4C75D]">
            Festival Todo Mundo no Samba
          </p>

          <h2 className="text-xl font-extrabold leading-snug">
            Controle de Ingressos Individuais
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Gerenciamento dos ingressos de Presidência e
            Pista. Cada QR Code é individual e permite
            apenas uma entrada.
          </p>
        </section>

        {/* ======================================
            RESUMO GERAL
        ====================================== */}

        <section className="mb-4 grid grid-cols-3 gap-2.5">
          {/* TOTAL */}

          <div className="min-w-0 rounded-2xl border border-[#F4C75D]/25 bg-gradient-to-b from-[#342A14] to-[#211C12] px-2 py-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4C75D]/15">
              <Ticket
                size={19}
                className="text-[#F4C75D]"
              />
            </div>

            <p className="text-2xl font-extrabold">
              {totalIngressos}
            </p>

            <p className="mt-1 text-[11px] text-amber-200/80">
              Total
            </p>
          </div>

          {/* DISPONÍVEIS */}

          <div className="min-w-0 rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-[#103327] to-[#0A1E1B] px-2 py-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
              <Clock3
                size={19}
                className="text-[#30D883]"
              />
            </div>

            <p className="text-2xl font-extrabold">
              {totalDisponiveis}
            </p>

            <p className="mt-1 text-[11px] text-emerald-200/80">
              Disponíveis
            </p>
          </div>

          {/* UTILIZADOS */}

          <div className="min-w-0 rounded-2xl border border-blue-500/25 bg-gradient-to-b from-[#14273A] to-[#101D2A] px-2 py-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
              <CheckCircle2
                size={19}
                className="text-blue-400"
              />
            </div>

            <p className="text-2xl font-extrabold">
              {totalUtilizados}
            </p>

            <p className="mt-1 text-[11px] text-blue-200/80">
              Utilizados
            </p>
          </div>
        </section>

        {/* CANCELADOS */}

        {totalCancelados > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <XCircle
                size={17}
                className="text-red-400"
              />

              <span className="text-xs font-semibold text-red-300">
                Ingressos cancelados
              </span>
            </div>

            <span className="text-sm font-bold text-red-400">
              {totalCancelados}
            </span>
          </div>
        )}

        {/* ======================================
            TÍTULO DAS CATEGORIAS
        ====================================== */}

        <div className="mb-4 mt-7 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            Categorias
          </h2>

          <span className="text-xs text-white/40">
            {totalIngressos} ingressos
          </span>
        </div>

        {/* ======================================
            LISTA DE CATEGORIAS
        ====================================== */}

        <section className="space-y-3">
          {categorias.map((categoria) => {
            const Icone = categoria.icone;

            const ingressosCategoria = ingressos.filter(
              (ingresso) =>
                ingresso.categoria === categoria.id
            );

            const total = ingressosCategoria.length;

            const utilizados = ingressosCategoria.filter(
              (ingresso) =>
                ingresso.status === "UTILIZADO"
            ).length;

            const disponiveis = ingressosCategoria.filter(
              (ingresso) =>
                ingresso.status === "DISPONIVEL"
            ).length;

            const cancelados = ingressosCategoria.filter(
              (ingresso) =>
                ingresso.status === "CANCELADO"
            ).length;

            const percentual =
              total > 0
                ? (utilizados / total) * 100
                : 0;

            return (
              <Link
                key={categoria.id}
                href={`/admin/ingressos-individuais/${categoria.id.toLowerCase()}`}
                className="block rounded-2xl border border-white/[0.08] bg-[#141D25] p-4 transition hover:border-[#F4C75D]/40 hover:bg-[#18232C]"
              >
                {/* IDENTIFICAÇÃO */}

                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F4C75D]/15 bg-[#F4C75D]/10">
                    <Icone
                      size={21}
                      className="text-[#F4C75D]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-snug">
                      {categoria.nome}
                    </h3>

                    <p className="mt-1 text-[11px] text-white/40">
                      {categoria.descricao}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/50">
                      <Ticket size={13} />

                      {utilizados} de {total} utilizados
                    </div>
                  </div>

                  <ArrowRight
                    size={18}
                    className="mt-2 shrink-0 text-[#F4C75D]"
                  />
                </div>

                {/* BARRA DE PROGRESSO */}

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] transition-all"
                    style={{
                      width: `${percentual}%`,
                    }}
                  />
                </div>

                {/* ESTATÍSTICAS */}

                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={12} />
                    {disponiveis} disponíveis
                  </span>

                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle size={12} />
                    {cancelados} cancelados
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        {/* ======================================
            LISTA VAZIA
        ====================================== */}

        {totalIngressos === 0 && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#141D25] px-5 py-8 text-center">
            <Ticket
              size={30}
              className="mx-auto mb-3 text-white/30"
            />

            <p className="text-sm font-semibold">
              Nenhum ingresso individual cadastrado
            </p>

            <p className="mt-2 text-xs text-white/40">
              Os ingressos aparecerão aqui quando
              forem cadastrados no banco de dados.
            </p>
          </div>
        )}

        {/* RODAPÉ */}

        <p className="mt-7 text-center text-[10px] text-white/30">
          G.R.E.S. Guardiões da Capadócia
        </p>
      </div>
    </main>
  );
}

// ==========================================
// CARREGAMENTO
// ==========================================

function IngressosIndividuaisLoading() {
  return (
    <main className="flex min-h-[65dvh] items-center justify-center bg-[#080F15] px-5 text-white">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-[#F4C75D]" />

        <p className="text-sm text-white/50">
          Carregando ingressos individuais...
        </p>
      </div>
    </main>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function IngressosIndividuaisPage() {
  return (
    <Suspense fallback={<IngressosIndividuaisLoading />}>
      <IngressosIndividuaisConteudo />
    </Suspense>
  );
}
