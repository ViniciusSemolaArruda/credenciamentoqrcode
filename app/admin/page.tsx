
import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AutoRefresh from "@/app/components/AutoRefresh";

import {
  CheckCircle2,
  UnlockKeyhole,
  XCircle,
  ArrowRight,
  Clock3,
} from "lucide-react";

type Periodo = "hoje" | "7dias" | "30dias";

type PageProps = {
  searchParams: Promise<{
    periodo?: string;
  }>;
};

// ==========================================
// CALCULAR INÍCIO DO PERÍODO
// ==========================================

function obterInicioPeriodo(periodo: Periodo) {
  const agora = new Date();

  // Data civil atual no horário de Brasília.
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);

  const valores = Object.fromEntries(
    partes.map((parte) => [
      parte.type,
      parte.value,
    ])
  );

  const inicioHoje = new Date(
    `${valores.year}-${valores.month}-${valores.day}T00:00:00-03:00`
  );

  if (periodo === "7dias") {
    inicioHoje.setUTCDate(
      inicioHoje.getUTCDate() - 6
    );
  }

  if (periodo === "30dias") {
    inicioHoje.setUTCDate(
      inicioHoje.getUTCDate() - 29
    );
  }

  return inicioHoje;
}

// ==========================================
// FORMATADORES
// ==========================================

function formatarHorario(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(data);
}

// ==========================================
// CONTEÚDO DO PAINEL
// ==========================================

async function PainelConteudo({
  periodo,
}: {
  periodo: Periodo;
}) {
  // IMPORTANTE:
  // Aguarda uma requisição real antes de calcular
  // a data atual. Corrige o erro de prerenderização
  // do Next.js 16 com cacheComponents habilitado.
  await connection();

  const inicio = obterInicioPeriodo(periodo);

  const [
    totalEntradas,
    totalLiberacoes,
    totalCancelados,
    ultimasEntradas,
  ] = await Promise.all([
    prisma.entrada.count({
      where: {
        horario: {
          gte: inicio,
        },
      },
    }),

    prisma.liberacaoIngresso.count({
      where: {
        autorizadoEm: {
          gte: inicio,
        },
      },
    }),

    // O schema atual não possui data de
    // cancelamento. Este é o total atual.
    prisma.ingresso.count({
      where: {
        status: "CANCELADO",
      },
    }),

    prisma.entrada.findMany({
      where: {
        horario: {
          gte: inicio,
        },
      },
      orderBy: {
        horario: "desc",
      },
      take: 8,
      include: {
        ingresso: {
          include: {
            escola: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const filtros: {
    valor: Periodo;
    nome: string;
  }[] = [
    { valor: "hoje", nome: "Hoje" },
    { valor: "7dias", nome: "7 dias" },
    { valor: "30dias", nome: "30 dias" },
  ];

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={5000} />

      {/* EFEITO DE FUNDO */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">
        {/* ======================================
            CABEÇALHO
        ====================================== */}

        <header className="mb-5 flex items-center gap-3">
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
              Painel Administrativo
            </h1>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

              <p className="text-[11px] text-white/45">
                Dados atualizados automaticamente
              </p>
            </div>
          </div>
        </header>

        {/* ======================================
            FILTROS
        ====================================== */}

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-[#121A21] p-1">
          {filtros.map((filtro) => {
            const ativo = periodo === filtro.valor;

            return (
              <Link
                key={filtro.valor}
                href={
                  filtro.valor === "hoje"
                    ? "/admin"
                    : `/admin?periodo=${filtro.valor}`
                }
                aria-current={ativo ? "page" : undefined}
                className={`flex h-10 items-center justify-center rounded-lg text-xs font-semibold transition ${
                  ativo
                    ? "bg-gradient-to-b from-[#FFE08A] to-[#DCA53D] text-[#231A0A] shadow-md"
                    : "text-white/45 hover:bg-white/5 hover:text-white"
                }`}
              >
                {filtro.nome}
              </Link>
            );
          })}
        </div>

        {/* ======================================
            ESTATÍSTICAS
        ====================================== */}

        <section className="grid grid-cols-3 gap-2.5">
          {/* ENTRADAS */}
          <div className="min-w-0 rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-[#103327] to-[#0A1E1B] px-2 py-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2
                size={19}
                className="text-[#30D883]"
              />
            </div>

            <p className="text-[clamp(17px,5vw,25px)] font-extrabold tracking-tight">
              {totalEntradas.toLocaleString("pt-BR")}
            </p>

            <p className="mt-1 text-[11px] font-medium text-emerald-200/80">
              Entradas
            </p>
          </div>

          {/* LIBERAÇÕES */}
          <div className="min-w-0 rounded-2xl border border-amber-400/25 bg-gradient-to-b from-[#342A14] to-[#211C12] px-2 py-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15">
              <UnlockKeyhole
                size={19}
                className="text-[#F4C75D]"
              />
            </div>

            <p className="text-[clamp(17px,5vw,25px)] font-extrabold tracking-tight">
              {totalLiberacoes.toLocaleString("pt-BR")}
            </p>

            <p className="mt-1 text-[11px] font-medium text-amber-200/80">
              Liberações
            </p>
          </div>

          {/* CANCELADOS */}
          <div className="min-w-0 rounded-2xl border border-red-500/25 bg-gradient-to-b from-[#35191C] to-[#211215] px-2 py-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
              <XCircle
                size={19}
                className="text-[#FF626B]"
              />
            </div>

            <p className="text-[clamp(17px,5vw,25px)] font-extrabold tracking-tight">
              {totalCancelados.toLocaleString("pt-BR")}
            </p>

            <p className="mt-1 text-[11px] font-medium text-red-200/80">
              Cancelados
            </p>

            <p className="mt-0.5 text-[9px] text-red-200/40">
              Total atual
            </p>
          </div>
        </section>

        {/* ======================================
            ÚLTIMAS ENTRADAS
        ====================================== */}

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              Últimas entradas
            </h2>

            <Link
              href="/admin/historico"
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#F4C75D] hover:text-[#FFE4A0]"
            >
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </div>

          {ultimasEntradas.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#131C24] px-5 py-10 text-center">
              <Clock3
                size={28}
                className="mx-auto mb-3 text-white/30"
              />

              <p className="text-sm font-semibold">
                Nenhuma entrada no período
              </p>

              <p className="mt-2 text-xs text-white/40">
                As entradas aparecerão aqui assim que
                forem registradas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimasEntradas.map((entrada) => (
                <div
                  key={entrada.id}
                  className="flex min-h-[69px] items-center gap-3 rounded-xl border border-white/[0.08] bg-[#141D25] px-3 py-2.5"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2DD778] shadow-[0_0_12px_rgba(45,215,120,0.45)]" />

                  <div className="w-[43px] shrink-0">
                    <p className="text-[11px] font-semibold text-white/80">
                      {formatarHorario(entrada.horario)}
                    </p>

                    <p className="mt-0.5 text-[10px] text-white/35">
                      {formatarData(entrada.horario)}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {entrada.ingresso.escola.nome}
                    </p>

                    <p className="mt-1 truncate text-[11px] text-white/45">
                      {entrada.nome} {entrada.sobrenome}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] text-white/45">
                    {entrada.funcionarioNumero
                      ? `Func. ${entrada.funcionarioNumero}`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RODAPÉ */}
        <p className="mt-6 text-center text-[10px] text-white/30">
          G.R.E.S. Guardiões da Capadócia
        </p>
      </div>
    </main>
  );
}

// ==========================================
// TELA DE CARREGAMENTO
// ==========================================

function CarregandoPainel() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080F15] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-[#F4C75D]" />

        <p className="text-xs text-white/50">
          Carregando painel...
        </p>
      </div>
    </main>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default async function AdminPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const periodo: Periodo =
    params.periodo === "7dias" ||
    params.periodo === "30dias"
      ? params.periodo
      : "hoje";

  return (
    <Suspense
      key={periodo}
      fallback={<CarregandoPainel />}
    >
      <PainelConteudo periodo={periodo} />
    </Suspense>
  );
}
