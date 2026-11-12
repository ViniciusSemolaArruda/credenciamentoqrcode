
import { Suspense } from "react";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";
import HistoricoClient from "./HistoricoClient";

// ==========================================
// CONTEÚDO DO HISTÓRICO ADMINISTRATIVO
// ==========================================

async function HistoricoContent() {
  // Verificar permissão do gerente.
  await requireRole("ADMIN");

  // ==========================================
  // CONSULTAR REGISTROS NO POSTGRESQL
  // ==========================================

  const [
    entradas,
    entradasIndividuais,
    entradasImprensa,
    liberacoes,
    ingressosUtilizadosEscolas,
    ingressosUtilizadosIndividuais,
    ingressosUtilizadosImprensa,
  ] = await Promise.all([
    // Entradas das escolas de samba.
    prisma.entrada.findMany({
      orderBy: [
        { horario: "desc" },
        { id: "desc" },
      ],
      include: {
        ingresso: {
          select: {
            codigo: true,
            escola: {
              select: {
                nome: true,
              },
            },
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    }),

    // Entradas de Presidência e Pista.
    prisma.entradaConvidado.findMany({
      orderBy: [
        { horario: "desc" },
        { id: "desc" },
      ],
      include: {
        ingressoConvidado: {
          select: {
            codigo: true,
            categoria: true,
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    }),

    // Entradas dos veículos de imprensa.
    prisma.entradaImprensa.findMany({
      orderBy: [
        { horario: "desc" },
        { id: "desc" },
      ],
      include: {
        ingressoImprensa: {
          select: {
            codigo: true,
            veiculo: {
              select: {
                nome: true,
              },
            },
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    }),

    // Liberações gerenciais das escolas.
    prisma.liberacaoIngresso.findMany({
      orderBy: [
        { autorizadoEm: "desc" },
        { id: "desc" },
      ],
      include: {
        ingresso: {
          select: {
            codigo: true,
            escola: {
              select: {
                nome: true,
              },
            },
          },
        },
        gerente: {
          select: {
            nome: true,
          },
        },
      },
    }),

    // Ingressos utilizados das escolas.
    prisma.ingresso.count({
      where: {
        status: "UTILIZADO",
      },
    }),

    // Ingressos individuais utilizados.
    prisma.ingressoConvidado.count({
      where: {
        status: "UTILIZADO",
      },
    }),

    // Ingressos da imprensa utilizados.
    prisma.ingressoImprensa.count({
      where: {
        status: "UTILIZADO",
      },
    }),
  ]);

  // ==========================================
  // ORGANIZAR ENTRADAS DAS ESCOLAS
  // ==========================================

  const registrosEntradas = entradas.map((entrada) => ({
    id: entrada.id,
    tipo: "ENTRADA" as const,
    categoriaIngresso: "ESCOLA" as const,
    nome: `${entrada.nome} ${entrada.sobrenome}`,
    escola: entrada.ingresso.escola.nome,
    codigo: entrada.ingresso.codigo,
    funcionarioNumero: entrada.funcionarioNumero,
    data: entrada.horario.toISOString(),
    motivo: null as string | null,
    gerente: null as string | null,
  }));

  // ==========================================
  // ORGANIZAR ENTRADAS INDIVIDUAIS
  // ==========================================

  const registrosIndividuais = entradasIndividuais.map(
    (entrada) => ({
      id: entrada.id,
      tipo: "ENTRADA" as const,
      categoriaIngresso: "INDIVIDUAL" as const,
      nome: `${entrada.nome} ${entrada.sobrenome}`,
      escola:
        entrada.ingressoConvidado.categoria === "PRESIDENCIA"
          ? "Presidência"
          : "Pista",
      codigo: entrada.ingressoConvidado.codigo,
      funcionarioNumero: entrada.funcionarioNumero,
      data: entrada.horario.toISOString(),
      motivo: null as string | null,
      gerente: null as string | null,
    })
  );

  // ==========================================
  // ORGANIZAR ENTRADAS DA IMPRENSA
  // ==========================================

  const registrosImprensa = entradasImprensa.map(
    (entrada) => ({
      id: entrada.id,
      tipo: "ENTRADA" as const,
      categoriaIngresso: "IMPRENSA" as const,
      nome: `${entrada.nome} ${entrada.sobrenome}`,
      escola: entrada.ingressoImprensa.veiculo.nome,
      codigo: entrada.ingressoImprensa.codigo,
      funcionarioNumero: entrada.funcionarioNumero,
      data: entrada.horario.toISOString(),
      motivo: null as string | null,
      gerente: null as string | null,
    })
  );

  // ==========================================
  // ORGANIZAR LIBERAÇÕES DAS ESCOLAS
  // ==========================================

  const registrosLiberacoes = liberacoes.map(
    (liberacao) => ({
      id: liberacao.id,
      tipo: "LIBERACAO" as const,
      categoriaIngresso: "ESCOLA" as const,
      nome: "Liberação de ingresso",
      escola: liberacao.ingresso.escola.nome,
      codigo: liberacao.ingresso.codigo,
      funcionarioNumero: liberacao.funcionarioNumero,
      data: liberacao.autorizadoEm.toISOString(),
      motivo: liberacao.motivo,
      gerente: liberacao.gerente.nome,
    })
  );

  // ==========================================
  // UNIFICAR E ORDENAR TODOS OS REGISTROS
  // ==========================================

  const registros = [
    ...registrosEntradas,
    ...registrosIndividuais,
    ...registrosImprensa,
    ...registrosLiberacoes,
  ].sort(
    (a, b) =>
      new Date(b.data).getTime() -
      new Date(a.data).getTime()
  );

  // ==========================================
  // CALCULAR ESTATÍSTICAS GERAIS
  // ==========================================

  const totalEntradas =
    entradas.length +
    entradasIndividuais.length +
    entradasImprensa.length;

  const totalLiberacoes = liberacoes.length;

  const ingressosUtilizados =
    ingressosUtilizadosEscolas +
    ingressosUtilizadosIndividuais +
    ingressosUtilizadosImprensa;

  // ==========================================
  // RENDERIZAR PÁGINA
  // ==========================================

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={5000} />

      {/* EFEITO SUAVE NO FUNDO */}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">
        {/* ======================================
            HEADER — MESMO PADRÃO DO PAINEL
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

          <div className="min-w-0">
            <h1 className="text-[19px] font-bold tracking-tight">
              Histórico de Credenciamento
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
            HISTÓRICO E FUNCIONALIDADES EXISTENTES
        ====================================== */}

        <HistoricoClient
          registros={registros}
          totalEntradas={totalEntradas}
          totalLiberacoes={totalLiberacoes}
          ingressosUtilizados={ingressosUtilizados}
        />
      </div>
    </main>
  );
}

// ==========================================
// TELA DE CARREGAMENTO
// ==========================================

function HistoricoLoading() {
  return (
    <main className="flex min-h-[65dvh] items-center justify-center bg-[#080F15] px-5 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#F4C75D]/20 bg-[#F4C75D]/10">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F4C75D]/20 border-t-[#F4C75D]" />
        </div>

        <h2 className="text-lg font-semibold">
          Histórico de Credenciamento
        </h2>

        <p className="text-sm text-white/45">
          Carregando entradas e liberações...
        </p>
      </div>
    </main>
  );
}

// ==========================================
// PÁGINA PRINCIPAL COM SUSPENSE
// ==========================================

export default function HistoricoPage() {
  return (
    <Suspense fallback={<HistoricoLoading />}>
      <HistoricoContent />
    </Suspense>
  );
}
