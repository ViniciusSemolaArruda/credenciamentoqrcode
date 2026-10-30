
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AutoRefresh from "@/app/components/AutoRefresh";
import {
  ArrowRight,
  Ticket,
  School,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

async function EscolasConteudo() {
  const escolas = await prisma.escola.findMany({
    orderBy: {
      nome: "asc",
    },
    include: {
      ingressos: {
        select: {
          status: true,
        },
      },
    },
  });

  const totalIngressos = escolas.reduce(
    (total, escola) => total + escola.ingressos.length,
    0
  );

  const totalUtilizados = escolas.reduce(
    (total, escola) =>
      total +
      escola.ingressos.filter(
        (ingresso) => ingresso.status === "UTILIZADO"
      ).length,
    0
  );

  const totalDisponiveis = escolas.reduce(
    (total, escola) =>
      total +
      escola.ingressos.filter(
        (ingresso) => ingresso.status === "DISPONIVEL"
      ).length,
    0
  );

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={5000} />

      {/* EFEITO DE FUNDO */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">

        {/* HEADER PADRÃO */}
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
              Escolas de Samba
            </h1>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

              <p className="text-[11px] text-white/45">
                Dados atualizados automaticamente
              </p>
            </div>
          </div>
        </header>

        {/* RESUMO */}
        <section className="mb-7 grid grid-cols-3 gap-2.5">
          <div className="min-w-0 rounded-2xl border border-[#F4C75D]/25 bg-gradient-to-b from-[#342A14] to-[#211C12] px-2 py-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4C75D]/15">
              <School
                size={19}
                className="text-[#F4C75D]"
              />
            </div>

            <p className="text-2xl font-extrabold">
              {escolas.length}
            </p>

            <p className="mt-1 text-[11px] text-amber-200/80">
              Escolas
            </p>
          </div>

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

        {/* TÍTULO DA LISTA */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            Escolas cadastradas
          </h2>

          <span className="text-xs text-white/40">
            {totalIngressos} ingressos
          </span>
        </div>

        {/* LISTA DE ESCOLAS */}
        <section className="space-y-3">
          {escolas.map((escola) => {
            const total = escola.ingressos.length;

            const utilizados = escola.ingressos.filter(
              (ingresso) =>
                ingresso.status === "UTILIZADO"
            ).length;

            const disponiveis = escola.ingressos.filter(
              (ingresso) =>
                ingresso.status === "DISPONIVEL"
            ).length;

            const cancelados = escola.ingressos.filter(
              (ingresso) =>
                ingresso.status === "CANCELADO"
            ).length;

            const percentual =
              total > 0
                ? (utilizados / total) * 100
                : 0;

            return (
              <Link
                key={escola.id}
                href={`/admin/escolas/${escola.id}`}
                className="block rounded-2xl border border-white/[0.08] bg-[#141D25] p-4 transition hover:border-[#F4C75D]/40 hover:bg-[#18232C]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F4C75D]/15 bg-[#F4C75D]/10">
                    <School
                      size={21}
                      className="text-[#F4C75D]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-snug">
                      {escola.nome}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/45">
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

        {/* LISTA VAZIA */}
        {escolas.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#141D25] px-5 py-12 text-center">
            <School
              size={32}
              className="mx-auto mb-3 text-white/30"
            />

            <p className="text-sm font-semibold">
              Nenhuma escola cadastrada
            </p>

            <p className="mt-2 text-xs text-white/40">
              As escolas aparecerão aqui quando
              forem cadastradas.
            </p>
          </div>
        )}

        <p className="mt-7 text-center text-[10px] text-white/30">
          G.R.E.S. Guardiões da Capadócia
        </p>
      </div>
    </main>
  );
}

function EscolasLoading() {
  return (
    <main className="flex min-h-[65dvh] items-center justify-center bg-[#080F15] px-5 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-[#F4C75D]" />

        <p className="text-sm text-white/50">
          Carregando escolas...
        </p>
      </div>
    </main>
  );
}

export default function EscolasPage() {
  return (
    <Suspense fallback={<EscolasLoading />}>
      <EscolasConteudo />
    </Suspense>
  );
}
