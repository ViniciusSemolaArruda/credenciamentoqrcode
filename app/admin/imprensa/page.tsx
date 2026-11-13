
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";

import {
  ArrowLeft,
  ArrowRight,
  Users,
  Ticket,
  Clock3,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";

const grupos = [
  {
    categoria: "CONVIDADOS_SANDRO",
    nome: "Convidados Sandro",
    slug: "sandro",
  },
  {
    categoria: "CONVIDADOS_ALBERTO",
    nome: "Convidados Alberto",
    slug: "alberto",
  },
] as const;

async function ConvidadosConteudo() {
  await requireRole("ADMIN");

  const ingressos = await prisma.ingressoConvidado.findMany({
    where: {
      categoria: {
        in: [
          "CONVIDADOS_SANDRO",
          "CONVIDADOS_ALBERTO",
        ],
      },
    },
    select: {
      id: true,
      categoria: true,
      status: true,
    },
  });

  const total = ingressos.length;

  const disponiveis = ingressos.filter(
    (item) => item.status === "DISPONIVEL"
  ).length;

  const utilizados = ingressos.filter(
    (item) => item.status === "UTILIZADO"
  ).length;

  const cancelados = ingressos.filter(
    (item) => item.status === "CANCELADO"
  ).length;

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={5000} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">
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

          <div>
            <h1 className="text-[19px] font-bold tracking-tight">
              Ingressos dos Convidados
            </h1>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

              <p className="text-[11px] text-white/45">
                Dados atualizados automaticamente
              </p>
            </div>
          </div>
        </header>

        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#F4C75D] hover:text-[#FFE08A]"
        >
          <ArrowLeft size={16} />
          Voltar ao painel
        </Link>

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

          <h2 className="text-xl font-extrabold">
            Credenciamento de Convidados
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Gerencie os ingressos dos convidados especiais
            de Sandro e Alberto. Cada QR Code é individual
            e permite apenas uma entrada.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3">
          {[
            {
              titulo: "Total",
              valor: total,
              Icone: Ticket,
              cor: "text-[#F4C75D]",
            },
            {
              titulo: "Disponíveis",
              valor: disponiveis,
              Icone: Clock3,
              cor: "text-emerald-400",
            },
            {
              titulo: "Utilizados",
              valor: utilizados,
              Icone: CheckCircle2,
              cor: "text-blue-400",
            },
            {
              titulo: "Cancelados",
              valor: cancelados,
              Icone: XCircle,
              cor: "text-red-400",
            },
          ].map(({ titulo, valor, Icone, cor }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-white/10 bg-[#141D25] p-4"
            >
              <Icone
                size={20}
                className={`mb-3 ${cor}`}
              />

              <p className="text-2xl font-extrabold">
                {valor}
              </p>

              <p className="mt-1 text-xs text-white/50">
                {titulo}
              </p>
            </div>
          ))}
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Grupos de convidados
          </h2>

          <span className="text-xs text-white/40">
            {grupos.length} grupos
          </span>
        </div>

        <section className="space-y-3">
          {grupos.map((grupo) => {
            const ingressosGrupo = ingressos.filter(
              (item) => item.categoria === grupo.categoria
            );

            const quantidade = ingressosGrupo.length;

            const usados = ingressosGrupo.filter(
              (item) => item.status === "UTILIZADO"
            ).length;

            const livres = ingressosGrupo.filter(
              (item) => item.status === "DISPONIVEL"
            ).length;

            const percentual =
              quantidade > 0
                ? (usados / quantidade) * 100
                : 0;

            return (
              <Link
                key={grupo.categoria}
                href={`/admin/convidados/${grupo.slug}`}
                className="block rounded-2xl border border-white/[0.08] bg-[#141D25] p-4 transition hover:border-[#F4C75D]/40 hover:bg-[#18232C]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F4C75D]/15 bg-[#F4C75D]/10">
                    <Users
                      size={21}
                      className="text-[#F4C75D]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">
                      {grupo.nome}
                    </h3>

                    <p className="mt-1 text-[11px] text-white/40">
                      {quantidade} ingressos de convidados
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/50">
                      <Ticket size={13} />
                      {usados} de {quantidade} utilizados
                    </div>
                  </div>

                  <ArrowRight
                    size={18}
                    className="mt-2 shrink-0 text-[#F4C75D]"
                  />
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#DCA53D] to-[#FFE08A]"
                    style={{ width: `${percentual}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-[11px]">
                  <span className="text-emerald-400">
                    {livres} disponíveis
                  </span>

                  <span className="text-blue-400">
                    {usados} utilizados
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        {total === 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#141D25] p-5 text-center text-sm text-white/50">
            Nenhum ingresso de convidados cadastrado.
            Execute o script de geração dos ingressos
            para preencher os grupos.
          </div>
        )}

        <p className="mt-7 text-center text-[10px] text-white/30">
          G.R.E.S. Guardiões da Capadócia
        </p>
      </div>
    </main>
  );
}

export default function ConvidadosPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#080F15] text-white/60">
          Carregando convidados...
        </main>
      }
    >
      <ConvidadosConteudo />
    </Suspense>
  );
}
