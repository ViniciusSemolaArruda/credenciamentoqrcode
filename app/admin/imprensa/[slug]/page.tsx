
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";

import QRCode from "qrcode";

import IngressoImprensaDownload from "../IngressoImprensaDownload";

import {
  ArrowLeft,
  Newspaper,
  Ticket,
  Clock3,
  CheckCircle2,
  XCircle,
  QrCode,
  UserRound,
  CalendarDays,
  History,
  ShieldCheck,
} from "lucide-react";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

async function VeiculoConteudo({ params }: PageProps) {
  await requireRole("ADMIN");

  const { slug } = await params;

  const veiculo = await prisma.veiculoImprensa.findUnique({
    where: { slug },
    include: {
      ingressos: {
        orderBy: { numero: "asc" },
        include: {
          entrada: {
            include: {
              usuario: {
                select: { nome: true },
              },
            },
          },
        },
      },
    },
  });

  if (!veiculo) {
    notFound();
  }

  const ingressosComQR = await Promise.all(
    veiculo.ingressos.map(async (ingresso) => {
      const qrImage = await QRCode.toDataURL(
        ingresso.qrToken,
        {
          width: 600,
          margin: 3,
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

  const total = veiculo.ingressos.length;

  const disponiveis = veiculo.ingressos.filter(
    (item) => item.status === "DISPONIVEL"
  ).length;

  const utilizados = veiculo.ingressos.filter(
    (item) => item.status === "UTILIZADO"
  ).length;

  const cancelados = veiculo.ingressos.filter(
    (item) => item.status === "CANCELADO"
  ).length;

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={5000} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">
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
              Imprensa - {veiculo.nome}
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
          href="/admin/imprensa"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#F4C75D] hover:text-[#FFE08A]"
        >
          <ArrowLeft size={16} />
          Voltar para imprensa
        </Link>

        <section className="mb-6 rounded-2xl border border-[#F4C75D]/20 bg-gradient-to-br from-[#25251D] to-[#141D25] p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#F4C75D]/20 bg-[#F4C75D]/10">
            <Newspaper
              size={23}
              className="text-[#F4C75D]"
            />
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4C75D]">
            Festival Todo Mundo no Samba
          </p>

          <h2 className="text-xl font-extrabold">
            {veiculo.nome}
          </h2>

          <p className="mt-2 text-xs text-white/45">
            Gerenciamento dos ingressos e QR Codes
            deste veículo de imprensa.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2.5">
            <ShieldCheck
              size={16}
              className="shrink-0 text-[#F4C75D]"
            />

            <p className="text-[11px] leading-relaxed text-white/60">
              Cada QR Code permite apenas uma entrada,
              sem acompanhantes.
            </p>
          </div>
        </section>

        <section className="mb-7 grid grid-cols-2 gap-3">
          {[
            {
              titulo: "Total de ingressos",
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
            {total} ingressos
          </span>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          {ingressosComQR.map((ingresso) => {
            const utilizado =
              ingresso.status === "UTILIZADO";

            const cancelado =
              ingresso.status === "CANCELADO";

            const numeroFormatado = String(
              ingresso.numero
            ).padStart(2, "0");

            const entrada = ingresso.entrada;

            return (
              <article
                key={ingresso.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141D25]"
              >
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
                  <div className="mx-auto mb-4 max-w-[250px] rounded-xl bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ingresso.qrImage}
                      alt={`QR Code ${ingresso.codigo}`}
                      className="aspect-square w-full"
                    />
                  </div>

                  <p className="truncate text-center text-sm font-semibold">
                    {veiculo.nome}
                  </p>

                  <p className="mt-1 text-center text-xs text-white/45">
                    Ingresso #{numeroFormatado}
                  </p>

                  <p className="mt-1 break-all text-center text-[10px] text-white/30">
                    {ingresso.codigo}
                  </p>

                  {entrada ? (
                    <div className="mt-5 overflow-hidden rounded-xl border border-emerald-500/20 bg-[#0C2520]">
                      <div className="flex items-center gap-2 border-b border-emerald-500/15 px-3 py-3">
                        <CheckCircle2
                          size={16}
                          className="text-emerald-400"
                        />

                        <h4 className="text-xs font-bold text-emerald-300">
                          Entrada registrada
                        </h4>
                      </div>

                      <div className="space-y-3 p-3">
                        <div className="flex items-start gap-2.5">
                          <UserRound
                            size={16}
                            className="mt-0.5 shrink-0 text-emerald-400"
                          />

                          <div>
                            <p className="text-[10px] text-white/40">
                              Profissional credenciado
                            </p>

                            <p className="mt-0.5 text-sm font-semibold">
                              {entrada.nome}{" "}
                              {entrada.sobrenome}
                            </p>
                          </div>
                        </div>

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
                              {`Funcionário ${entrada.funcionarioNumero}`}
                            </p>

                            <p className="mt-1 text-[10px] text-white/40">
                              {entrada.usuario.nome}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-emerald-500/15 pt-3">
                          <div className="flex items-start gap-2">
                            <CalendarDays
                              size={15}
                              className="mt-0.5 text-emerald-400"
                            />

                            <div>
                              <p className="text-[10px] text-white/40">
                                Data
                              </p>

                              <p className="mt-0.5 text-xs font-semibold">
                                {formatarData(entrada.horario)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock3
                              size={15}
                              className="mt-0.5 text-emerald-400"
                            />

                            <div>
                              <p className="text-[10px] text-white/40">
                                Horário
                              </p>

                              <p className="mt-0.5 text-xs font-semibold">
                                {formatarHorario(entrada.horario)}
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

                  <IngressoImprensaDownload
                    qrImage={ingresso.qrImage}
                    codigo={ingresso.codigo}
                    numero={ingresso.numero}
                    veiculo={veiculo.nome}
                  />
                </div>
              </article>
            );
          })}
        </section>

        {total === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#141D25] p-8 text-center text-sm text-white/50">
            Nenhum ingresso cadastrado para este veículo.
          </div>
        )}

        <p className="mt-7 text-center text-[10px] text-white/30">
          G.R.E.S. Guardiões da Capadócia
        </p>
      </div>
    </main>
  );
}

export default function VeiculoImprensaPage({
  params,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#080F15] text-white/60">
          Carregando QR Codes...
        </main>
      }
    >
      <VeiculoConteudo params={params} />
    </Suspense>
  );
}
