
import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";

import {
  ArrowLeft,
  TicketCheck,
  Mail,
  MailCheck,
  Clock3,
  Download,
  CheckCircle2,
  RotateCcw,
  UserRound,
  CalendarDays,
} from "lucide-react";

import {
  marcarEmailEnviado,
  marcarEmailPendente,
} from "./actions";

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

async function RetiradasConteudo() {
  await connection();
  await requireRole("ADMIN");

  const retiradas = await prisma.retiradaIngresso.findMany({
    where: {
      ativo: true,
    },
    orderBy: {
      retiradoEm: "desc",
    },
    select: {
      id: true,
      nomeCompleto: true,
      email: true,
      retiradoEm: true,
      emailEnviadoEm: true,
      ingresso: {
        select: {
          numero: true,
          codigo: true,
          escola: {
            select: {
              nome: true,
            },
          },
        },
      },
    },
  });

  const total = retiradas.length;

  const enviados = retiradas.filter(
    (retirada) => retirada.emailEnviadoEm !== null
  ).length;

  const pendentes = total - enviados;

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={10000} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">
        {/* CABEÇALHO */}
        <header className="mb-6">
          <Link
            href="/admin/mais"
            className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-white/50 transition hover:text-[#F4C75D]"
          >
            <ArrowLeft size={16} />
            Voltar para Mais opções
          </Link>

          <div className="flex items-center gap-3">
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
                Retiradas de ingressos
              </h1>

              <p className="mt-1 text-[11px] text-white/45">
                Controle de participantes e envios
              </p>
            </div>
          </div>
        </header>

        {/* ESTATÍSTICAS */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-[#141D25] px-2 py-4 text-center">
            <TicketCheck
              size={20}
              className="mx-auto mb-2 text-[#F4C75D]"
            />

            <p className="text-2xl font-extrabold">
              {total}
            </p>

            <p className="mt-1 text-[10px] text-white/50">
              Retirados
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-[#211C12] px-2 py-4 text-center">
            <Clock3
              size={20}
              className="mx-auto mb-2 text-[#F4C75D]"
            />

            <p className="text-2xl font-extrabold text-[#F4C75D]">
              {pendentes}
            </p>

            <p className="mt-1 text-[10px] text-amber-100/60">
              Pendentes
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0A211A] px-2 py-4 text-center">
            <MailCheck
              size={20}
              className="mx-auto mb-2 text-emerald-400"
            />

            <p className="text-2xl font-extrabold text-emerald-400">
              {enviados}
            </p>

            <p className="mt-1 text-[10px] text-emerald-100/60">
              Enviados
            </p>
          </div>
        </section>

        {/* LISTAGEM */}
        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                Solicitações recebidas
              </h2>

              <p className="mt-1 text-[11px] text-white/40">
                Atualização automática a cada 10 segundos
              </p>
            </div>

            <span className="rounded-full border border-[#F4C75D]/20 bg-[#F4C75D]/10 px-3 py-1 text-xs font-bold text-[#F4C75D]">
              {total}
            </span>
          </div>

          {retiradas.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#141D25] px-5 py-12 text-center">
              <Mail
                size={32}
                className="mx-auto mb-3 text-white/25"
              />

              <p className="text-sm font-semibold">
                Nenhuma retirada registrada
              </p>

              <p className="mt-2 text-xs leading-relaxed text-white/40">
                Quando um participante retirar um ingresso,
                os dados aparecerão automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {retiradas.map((retirada) => {
                const enviado =
                  retirada.emailEnviadoEm !== null;

                return (
                  <article
                    key={retirada.id}
                    className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141D25]"
                  >
                    {/* TOPO DO CARD */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] p-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F4C75D]">
                          {retirada.ingresso.escola.nome}
                        </p>

                        <h3 className="mt-1.5 text-base font-bold">
                          Ingresso Nº{" "}
                          {String(
                            retirada.ingresso.numero
                          ).padStart(2, "0")}
                        </h3>

                        <p className="mt-1 break-all text-[10px] text-white/35">
                          {retirada.ingresso.codigo}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${
                          enviado
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-400/10 text-[#F4C75D]"
                        }`}
                      >
                        {enviado ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock3 size={12} />
                        )}

                        {enviado ? "Enviado" : "Pendente"}
                      </span>
                    </div>

                    {/* PARTICIPANTE */}
                    <div className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        <UserRound
                          size={17}
                          className="mt-0.5 shrink-0 text-white/35"
                        />

                        <div className="min-w-0">
                          <p className="text-[10px] text-white/40">
                            Nome completo
                          </p>

                          <p className="mt-1 break-words text-sm font-semibold">
                            {retirada.nomeCompleto}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail
                          size={17}
                          className="mt-0.5 shrink-0 text-white/35"
                        />

                        <div className="min-w-0">
                          <p className="text-[10px] text-white/40">
                            E-mail do participante
                          </p>

                          <a
                            href={`mailto:${retirada.email}`}
                            className="mt-1 block break-all text-sm font-semibold text-[#F4C75D] underline-offset-4 hover:underline"
                          >
                            {retirada.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CalendarDays
                          size={17}
                          className="mt-0.5 shrink-0 text-white/35"
                        />

                        <div>
                          <p className="text-[10px] text-white/40">
                            Data da retirada
                          </p>

                          <p className="mt-1 text-xs font-medium text-white/75">
                            {formatarData(retirada.retiradoEm)}
                          </p>
                        </div>
                      </div>

                      {retirada.emailEnviadoEm && (
                        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                          <p className="text-[11px] text-emerald-300">
                            E-mail marcado como enviado em{" "}
                            {formatarData(
                              retirada.emailEnviadoEm
                            )}
                          </p>
                        </div>
                      )}

                      {/* BAIXAR QR CODE */}
                      <a
                        href={`/api/admin/retiradas/${retirada.id}/qr`}
                        download
                        className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#F4C75D]/25 bg-[#F4C75D]/10 px-4 text-xs font-bold text-[#F4C75D] transition hover:bg-[#F4C75D]/20"
                      >
                        <Download size={17} />
                        Baixar QR Code original
                      </a>

                      {/* CONTROLE DE ENVIO */}
                      {enviado ? (
                        <form action={marcarEmailPendente}>
                          <input
                            type="hidden"
                            name="retiradaId"
                            value={retirada.id}
                          />

                          <button
                            type="submit"
                            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                          >
                            <RotateCcw size={16} />
                            Marcar como pendente
                          </button>
                        </form>
                      ) : (
                        <form action={marcarEmailEnviado}>
                          <input
                            type="hidden"
                            name="retiradaId"
                            value={retirada.id}
                          />

                          <button
                            type="submit"
                            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFE08A] to-[#DCA53D] px-4 text-xs font-extrabold text-[#231A0A] transition hover:brightness-110"
                          >
                            <MailCheck size={17} />
                            Marcar e-mail como enviado
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-7 text-center text-[10px] text-white/30">
          G.R.E.S. Guardiões da Capadócia
        </p>
      </div>
    </main>
  );
}

function CarregandoRetiradas() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080F15] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-[#F4C75D]" />

        <p className="text-xs text-white/50">
          Carregando retiradas...
        </p>
      </div>
    </main>
  );
}

export default function RetiradasPage() {
  return (
    <Suspense fallback={<CarregandoRetiradas />}>
      <RetiradasConteudo />
    </Suspense>
  );
}
