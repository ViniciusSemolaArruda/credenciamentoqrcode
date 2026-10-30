
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";
import QRCode from "qrcode";

import RedefinirIngressoButton from "./RedefinirIngressoButton";

import {
  ArrowLeft,
  Ticket,
  CheckCircle2,
  Clock3,
  XCircle,
  Download,
  QrCode,
  UserRound,
  CalendarDays,
  History,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// TIPAGEM
// ==========================================

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// ==========================================
// FORMATADORES
// ==========================================

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function formatarHorario(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(data);
}

// ==========================================
// CONTEÚDO DA ESCOLA
// ==========================================

async function EscolaContent({ params }: PageProps) {
  // Verificar permissão
  await requireRole("ADMIN");

  const { id } = await params;

  // ==========================================
  // BUSCAR ESCOLA, INGRESSOS E ENTRADAS
  // ==========================================

  const escola = await prisma.escola.findUnique({
    where: {
      id,
    },
    include: {
      ingressos: {
        orderBy: {
          numero: "asc",
        },
        select: {
          id: true,
          numero: true,
          codigo: true,
          qrToken: true,
          status: true,

          // Histórico de entradas deste QR Code
          entradas: {
            orderBy: [
              { horario: "desc" },
              { id: "desc" },
            ],
            select: {
              id: true,
              nome: true,
              sobrenome: true,
              horario: true,
              funcionarioNumero: true,
              usuario: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!escola) {
    notFound();
  }

  // ==========================================
  // GERAR QR CODES
  // ==========================================

  const ingressosComQR = await Promise.all(
    escola.ingressos.map(async (ingresso) => {
      const qrImage = await QRCode.toDataURL(
        ingresso.qrToken,
        {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        }
      );

      return {
        ...ingresso,
        qrImage,
      };
    })
  );

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  const totalIngressos = escola.ingressos.length;

  const utilizados = escola.ingressos.filter(
    (ingresso) => ingresso.status === "UTILIZADO"
  ).length;

  const disponiveis = escola.ingressos.filter(
    (ingresso) => ingresso.status === "DISPONIVEL"
  ).length;

  const cancelados = escola.ingressos.filter(
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
              Detalhes da Escola
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
          href="/admin/escolas"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#F4C75D] transition hover:text-[#FFE08A]"
        >
          <ArrowLeft size={16} />
          Voltar para escolas
        </Link>

        {/* ======================================
            IDENTIFICAÇÃO DA ESCOLA
        ====================================== */}

        <section className="mb-6 rounded-2xl border border-[#F4C75D]/20 bg-gradient-to-br from-[#25251D] to-[#141D25] p-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4C75D]">
            Escola de Samba
          </p>

          <h2 className="text-xl font-extrabold leading-snug">
            {escola.nome}
          </h2>

          <p className="mt-2 text-xs text-white/45">
            Gerenciamento de ingressos, entradas e QR Codes
          </p>
        </section>

        {/* ======================================
            ESTATÍSTICAS
        ====================================== */}

        <section className="mb-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#F4C75D]/20 bg-[#211C12] p-4">
            <Ticket
              size={20}
              className="mb-3 text-[#F4C75D]"
            />

            <p className="text-2xl font-extrabold">
              {totalIngressos}
            </p>

            <p className="mt-1 text-xs text-white/50">
              Total de ingressos
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0A1E1B] p-4">
            <Clock3
              size={20}
              className="mb-3 text-emerald-400"
            />

            <p className="text-2xl font-extrabold">
              {disponiveis}
            </p>

            <p className="mt-1 text-xs text-emerald-200/70">
              Disponíveis
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-[#101D2A] p-4">
            <CheckCircle2
              size={20}
              className="mb-3 text-blue-400"
            />

            <p className="text-2xl font-extrabold">
              {utilizados}
            </p>

            <p className="mt-1 text-xs text-blue-200/70">
              Utilizados
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-[#211215] p-4">
            <XCircle
              size={20}
              className="mb-3 text-red-400"
            />

            <p className="text-2xl font-extrabold">
              {cancelados}
            </p>

            <p className="mt-1 text-xs text-red-200/70">
              Cancelados
            </p>
          </div>
        </section>

        {/* ======================================
            TÍTULO DOS QR CODES
        ====================================== */}

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <QrCode
              size={20}
              className="text-[#F4C75D]"
            />

            <h2 className="text-lg font-bold">
              QR Codes
            </h2>
          </div>

          <span className="text-xs text-white/40">
            {totalIngressos} ingressos
          </span>
        </div>

        {totalIngressos === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#141D25] p-8 text-center">
            <p className="text-sm text-white/50">
              Nenhum ingresso cadastrado para esta escola.
            </p>
          </div>
        )}

        {/* ======================================
            INGRESSOS
        ====================================== */}

        <section className="grid gap-4 sm:grid-cols-2">
          {ingressosComQR.map((ingresso) => {
            const utilizado =
              ingresso.status === "UTILIZADO";

            const cancelado =
              ingresso.status === "CANCELADO";

            const numeroFormatado = String(
              ingresso.numero
            ).padStart(2, "0");

            // Última entrada confirmada
            const ultimaEntrada =
              ingresso.entradas[0] ?? null;

            // Entradas anteriores
            const entradasAnteriores =
              ingresso.entradas.slice(1);

            return (
              <article
                key={ingresso.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141D25]"
              >

                {/* CABEÇALHO DO INGRESSO */}
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] px-4 py-3">
                  <h3 className="text-sm font-bold">
                    Ingresso #{numeroFormatado}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      utilizado
                        ? "bg-blue-500/15 text-blue-400"
                        : cancelado
                          ? "bg-red-500/15 text-red-400"
                          : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {utilizado
                      ? "Utilizado"
                      : cancelado
                        ? "Cancelado"
                        : "Disponível"}
                  </span>
                </div>

                <div className="p-4">

                  {/* QR CODE */}
                  <div className="mx-auto mb-4 max-w-[250px] rounded-xl bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ingresso.qrImage}
                      alt={`QR Code do ingresso ${numeroFormatado} da escola ${escola.nome}`}
                      className="aspect-square w-full"
                    />
                  </div>

                  {/* IDENTIFICAÇÃO */}
                  <p className="truncate text-center text-sm font-semibold">
                    {escola.nome}
                  </p>

                  <p className="mt-1 text-center text-xs text-white/45">
                    Ingresso #{numeroFormatado}
                  </p>

                  {/* ==================================
                      ÚLTIMA ENTRADA
                  ================================== */}

                  {ultimaEntrada ? (
                    <div className="mt-5 overflow-hidden rounded-xl border border-emerald-500/20 bg-[#0C2520]">
                      <div className="flex items-center justify-between border-b border-emerald-500/15 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            size={16}
                            className="text-emerald-400"
                          />

                          <h4 className="text-xs font-bold text-emerald-300">
                            Última entrada registrada
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-3 p-3">

                        {/* PARTICIPANTE */}
                        <div className="flex items-start gap-2.5">
                          <UserRound
                            size={16}
                            className="mt-0.5 shrink-0 text-emerald-400"
                          />

                          <div className="min-w-0">
                            <p className="text-[10px] text-white/40">
                              Participante
                            </p>

                            <p className="mt-0.5 break-words text-sm font-semibold">
                              {ultimaEntrada.nome}{" "}
                              {ultimaEntrada.sobrenome}
                            </p>
                          </div>
                        </div>

                        {/* FUNCIONÁRIO */}
                        <div className="flex items-start gap-2.5">
                          <ShieldCheck
                            size={16}
                            className="mt-0.5 shrink-0 text-emerald-400"
                          />

                          <div>
                            <p className="text-[10px] text-white/40">
                              Funcionário responsável
                            </p>

                            <p className="mt-0.5 text-xs font-semibold">
                              {ultimaEntrada.funcionarioNumero
                                ? `Funcionário ${ultimaEntrada.funcionarioNumero}`
                                : ultimaEntrada.usuario.nome}
                            </p>
                          </div>
                        </div>

                        {/* DATA E HORÁRIO */}
                        <div className="grid grid-cols-2 gap-3 border-t border-emerald-500/15 pt-3">
                          <div className="flex items-start gap-2">
                            <CalendarDays
                              size={15}
                              className="mt-0.5 shrink-0 text-emerald-400"
                            />

                            <div>
                              <p className="text-[10px] text-white/40">
                                Data
                              </p>

                              <p className="mt-0.5 text-xs font-semibold">
                                {formatarData(
                                  ultimaEntrada.horario
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock3
                              size={15}
                              className="mt-0.5 shrink-0 text-emerald-400"
                            />

                            <div>
                              <p className="text-[10px] text-white/40">
                                Horário
                              </p>

                              <p className="mt-0.5 text-xs font-semibold">
                                {formatarHorario(
                                  ultimaEntrada.horario
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#0E171E] px-3 py-4 text-center">
                      <History
                        size={20}
                        className="mx-auto mb-2 text-white/25"
                      />

                      <p className="text-xs text-white/45">
                        Nenhuma entrada registrada
                      </p>
                    </div>
                  )}

                  {/* ==================================
                      HISTÓRICO DE ENTRADAS
                  ================================== */}

                  {entradasAnteriores.length > 0 && (
                    <details className="group mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#101920]">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center gap-2">
                          <History
                            size={16}
                            className="text-[#F4C75D]"
                          />

                          <span className="text-xs font-semibold">
                            Entradas anteriores
                          </span>
                        </div>

                        <span className="rounded-full bg-[#F4C75D]/10 px-2 py-1 text-[10px] font-bold text-[#F4C75D]">
                          {entradasAnteriores.length}
                        </span>
                      </summary>

                      <div className="space-y-2 border-t border-white/[0.08] p-3">
                        {entradasAnteriores.map(
                          (entrada, indice) => (
                            <div
                              key={entrada.id}
                              className="rounded-lg border border-white/[0.06] bg-[#17212A] p-3"
                            >
                              <p className="mb-2 text-[10px] font-semibold text-[#F4C75D]">
                                Registro anterior #{indice + 1}
                              </p>

                              <p className="break-words text-xs font-semibold">
                                {entrada.nome}{" "}
                                {entrada.sobrenome}
                              </p>

                              <p className="mt-1.5 text-[11px] text-white/50">
                                {entrada.funcionarioNumero
                                  ? `Funcionário ${entrada.funcionarioNumero}`
                                  : entrada.usuario.nome}
                              </p>

                              <p className="mt-1 text-[11px] text-white/40">
                                {formatarData(entrada.horario)}
                                {" às "}
                                {formatarHorario(entrada.horario)}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </details>
                  )}

                  {/* TOTAL DE REGISTROS */}
                  {ingresso.entradas.length > 0 && (
                    <p className="mt-3 text-center text-[10px] text-white/35">
                      {ingresso.entradas.length}{" "}
                      {ingresso.entradas.length === 1
                        ? "entrada registrada"
                        : "entradas registradas"}{" "}
                      neste QR Code
                    </p>
                  )}

                  {/* ==================================
                      BAIXAR QR CODE
                  ================================== */}

                  <a
                    href={ingresso.qrImage}
                    download={`QR-${ingresso.codigo}.png`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DCA53D] to-[#FFE08A] px-4 py-3 text-sm font-bold text-[#231A0A] transition hover:brightness-110"
                  >
                    <Download size={17} />
                    Baixar QR Code
                  </a>

                  {/* ==================================
                      REDEFINIR INGRESSO
                  ================================== */}

                  {utilizado && (
                    <RedefinirIngressoButton
                      ingressoId={ingresso.id}
                      codigo={ingresso.codigo}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </section>

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

function EscolaLoading() {
  return (
    <main className="flex min-h-[65dvh] items-center justify-center bg-[#080F15] px-5 text-white">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-[#F4C75D]" />

        <p className="text-sm text-white/50">
          Carregando ingressos da escola...
        </p>
      </div>
    </main>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function EscolaPage({
  params,
}: PageProps) {
  return (
    <Suspense fallback={<EscolaLoading />}>
      <EscolaContent params={params} />
    </Suspense>
  );
}
