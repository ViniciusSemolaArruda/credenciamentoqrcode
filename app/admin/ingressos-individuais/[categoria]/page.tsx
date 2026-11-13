
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";

import QRCode from "qrcode";
import DownloadsIngressos from "./DownloadsIngressos";

import {
  ArrowLeft,
  Ticket,
  Crown,
  CheckCircle2,
  Clock3,
  XCircle,
  QrCode,
  UserRound,
  UsersRound,
  CalendarDays,
  History,
  ShieldCheck,
  FileArchive,
} from "lucide-react";

type CategoriaIngresso =
  | "PRESIDENCIA"
  | "PISTA"
  | "CONVIDADOS_SANDRO"
  | "CONVIDADOS_ALBERTO";

type PageProps = {
  params: Promise<{
    categoria: string;
  }>;
};

const categorias = {
  PRESIDENCIA: {
    nome: "Presidência",
    icone: Crown,
  },
  PISTA: {
    nome: "Pista",
    icone: Ticket,
  },
  CONVIDADOS_SANDRO: {
    nome: "Convidados Sandro",
    icone: UsersRound,
  },
  CONVIDADOS_ALBERTO: {
    nome: "Convidados Alberto",
    icone: UsersRound,
  },
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

function obterCategoria(
  valor: string
): CategoriaIngresso | null {
  const categoria = valor.toUpperCase();

  if (
    categoria === "PRESIDENCIA" ||
    categoria === "PISTA" ||
    categoria === "CONVIDADOS_SANDRO" ||
    categoria === "CONVIDADOS_ALBERTO"
  ) {
    return categoria;
  }

  return null;
}

async function CategoriaConteudo({
  params,
}: PageProps) {
  await requireRole("ADMIN");

  const { categoria: parametro } = await params;
  const categoria = obterCategoria(parametro);

  if (!categoria) {
    notFound();
  }

  const configuracao = categorias[categoria];
  const nomeCategoria = configuracao.nome;
  const IconeCategoria = configuracao.icone;

  // ==========================================
  // BUSCAR INGRESSOS
  // ==========================================

  const ingressos =
    await prisma.ingressoConvidado.findMany({
      where: {
        categoria,
      },
      orderBy: {
        numero: "asc",
      },
      select: {
        id: true,
        numero: true,
        codigo: true,
        qrToken: true,
        status: true,
        entrada: {
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
    });

  // ==========================================
  // GERAR QR CODES
  // ==========================================

  const ingressosComQR = await Promise.all(
    ingressos.map(async (ingresso) => {
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

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  const totalIngressos = ingressos.length;

  const utilizados = ingressos.filter(
    (ingresso) => ingresso.status === "UTILIZADO"
  ).length;

  const disponiveis = ingressos.filter(
    (ingresso) => ingresso.status === "DISPONIVEL"
  ).length;

  const cancelados = ingressos.filter(
    (ingresso) => ingresso.status === "CANCELADO"
  ).length;

  const dadosDownloads = ingressosComQR.map(
    (ingresso) => ({
      id: ingresso.id,
      codigo: ingresso.codigo,
      numero: ingresso.numero,
      qrImage: ingresso.qrImage,
    })
  );

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <AutoRefresh intervalo={5000} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">

        {/* CABEÇALHO */}
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
              Ingressos - {nomeCategoria}
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
          href="/admin/ingressos-individuais"
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#F4C75D] transition hover:text-[#FFE08A]"
        >
          <ArrowLeft size={16} />
          Voltar para categorias
        </Link>

        {/* IDENTIFICAÇÃO DA CATEGORIA */}
        <section className="mb-6 rounded-2xl border border-[#F4C75D]/20 bg-gradient-to-br from-[#25251D] to-[#141D25] p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#F4C75D]/20 bg-[#F4C75D]/10">
            <IconeCategoria
              size={23}
              className="text-[#F4C75D]"
            />
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4C75D]">
            Festival Todo Mundo no Samba
          </p>

          <h2 className="text-xl font-extrabold leading-snug">
            {nomeCategoria}
          </h2>

          <p className="mt-2 text-xs text-white/45">
            Gerenciamento dos ingressos individuais,
            entradas e QR Codes.
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

        {/* ESTATÍSTICAS */}
        <section className="mb-6 grid grid-cols-2 gap-3">

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
            BAIXAR TODOS EM ZIP
        ====================================== */}

        <section className="mb-7 rounded-2xl border border-[#F4C75D]/30 bg-gradient-to-br from-[#2D2517] to-[#141D25] p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4C75D]/10">
              <FileArchive
                size={23}
                className="text-[#F4C75D]"
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-extrabold">
                Download de todos os ingressos
              </h3>

              <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                Baixe os {totalIngressos} ingressos de{" "}
                {nomeCategoria} em um único arquivo ZIP.
              </p>
            </div>
          </div>

          <DownloadsIngressos
            categoria={categoria}
            ingressos={dadosDownloads}
            modo="todos"
          />

          <p className="mt-3 text-center text-[10px] text-white/40">
            {categoria === "CONVIDADOS_SANDRO" ||
            categoria === "CONVIDADOS_ALBERTO"
              ? "Todos os PNGs serão gerados com a arte oficial do festival."
              : "Todos os QR Codes serão reunidos em um único ZIP."}
          </p>
        </section>

        {/* TÍTULO DOS QR CODES */}
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

        {/* LISTA VAZIA */}
        {totalIngressos === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#141D25] p-8 text-center">
            <p className="text-sm text-white/50">
              Nenhum ingresso cadastrado nesta categoria.
            </p>
          </div>
        )}

        {/* LISTAGEM */}
        <section className="grid gap-4 sm:grid-cols-2">
          {ingressosComQR.map((ingresso) => {
            const utilizado =
              ingresso.status === "UTILIZADO";

            const cancelado =
              ingresso.status === "CANCELADO";

            const numeroFormatado = String(
              ingresso.numero
            ).padStart(3, "0");

            const entrada = ingresso.entrada;

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
                      alt={`QR Code do ingresso ${numeroFormatado} - ${nomeCategoria}`}
                      className="aspect-square w-full"
                    />
                  </div>

                  {/* IDENTIFICAÇÃO */}
                  <p className="truncate text-center text-sm font-semibold">
                    {nomeCategoria}
                  </p>

                  <p className="mt-1 text-center text-xs text-white/45">
                    Ingresso #{numeroFormatado}
                  </p>

                  <p className="mt-1 break-all text-center text-[10px] text-white/30">
                    {ingresso.codigo}
                  </p>

                  {/* HISTÓRICO DA ENTRADA */}
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
                              {entrada.nome}{" "}
                              {entrada.sobrenome}
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
                              {entrada.funcionarioNumero
                                ? `Funcionário ${entrada.funcionarioNumero}`
                                : entrada.usuario.nome}
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
                                  entrada.horario
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
                                  entrada.horario
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

                  {/* DOWNLOAD INDIVIDUAL */}
                  <DownloadsIngressos
                    categoria={categoria}
                    ingressos={[
                      {
                        id: ingresso.id,
                        codigo: ingresso.codigo,
                        numero: ingresso.numero,
                        qrImage: ingresso.qrImage,
                      },
                    ]}
                    modo="individual"
                  />

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

function CategoriaLoading() {
  return (
    <main className="flex min-h-[65dvh] items-center justify-center bg-[#080F15] px-5 text-white">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-[#F4C75D]" />

        <p className="text-sm text-white/50">
          Carregando QR Codes...
        </p>
      </div>
    </main>
  );
}

export default function CategoriaPage({
  params,
}: PageProps) {
  return (
    <Suspense fallback={<CategoriaLoading />}>
      <CategoriaConteudo params={params} />
    </Suspense>
  );
}
