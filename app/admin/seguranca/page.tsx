
import { Suspense } from "react";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import AutoRefresh from "@/app/components/AutoRefresh";
import DesbloquearPinButton from "./DesbloquearPinButton";

import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
  History,
  Clock3,
  KeyRound,
} from "lucide-react";

const CONTROLE_PIN_ID = "PIN_GERENCIAL_GLOBAL";

const RESULTADOS: Record<string, string> = {
  CORRETO: "PIN correto",
  INCORRETO: "PIN incorreto",
  LIMITE_ATINGIDO: "Limite atingido",
  BLOQUEADO: "Tentativa bloqueada",
};

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(data);
}

async function SegurancaContent() {
  await requireRole("ADMIN");

  // A página consulta o horário atual e os dados
  // de segurança no momento da requisição.
  await connection();

  const [controle, tentativas, totalTentativas] =
    await Promise.all([
      prisma.controlePinGerente.findUnique({
        where: { id: CONTROLE_PIN_ID },
      }),

      prisma.tentativaPinGerente.findMany({
        orderBy: [
          { criadoEm: "desc" },
          { id: "desc" },
        ],
        take: 100,
      }),

      prisma.tentativaPinGerente.count(),
    ]);

  const funcionarioIds = [
    ...new Set(
      tentativas.map((item) => item.funcionarioId)
    ),
  ];

  const ingressoIds = [
    ...new Set(
      tentativas
        .map((item) => item.ingressoId)
        .filter((id): id is string => id !== null)
    ),
  ];

  const [usuarios, ingressos] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        id: { in: funcionarioIds },
      },
      select: {
        id: true,
        nome: true,
      },
    }),

    prisma.ingresso.findMany({
      where: {
        id: { in: ingressoIds },
      },
      select: {
        id: true,
        codigo: true,
        escola: {
          select: {
            nome: true,
          },
        },
      },
    }),
  ]);

  const usuariosPorId = new Map(
    usuarios.map((usuario) => [
      usuario.id,
      usuario.nome,
    ])
  );

  const ingressosPorId = new Map(
    ingressos.map((ingresso) => [
      ingresso.id,
      {
        codigo: ingresso.codigo,
        escola: ingresso.escola.nome,
      },
    ])
  );

  const agora = new Date();

  const bloqueado = Boolean(
    controle?.bloqueadoAte &&
      controle.bloqueadoAte > agora
  );

  const tentativasIncorretas =
    controle?.bloqueadoAte &&
    controle.bloqueadoAte <= agora
      ? 0
      : controle?.tentativas ?? 0;

  const restantes = Math.max(
    0,
    5 - tentativasIncorretas
  );

  return (
    <main className="relative min-h-dvh bg-[#080F15] pb-8 text-white">
      <AutoRefresh intervalo={5000} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pt-5">
        {/* CABEÇALHO */}
        <header className="mb-6 flex items-center gap-3">
          <Link
            href="/admin"
            aria-label="Voltar ao painel"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#F4C75D] transition hover:bg-white/10"
          >
            <ArrowLeft size={19} />
          </Link>

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
            <h1 className="text-[18px] font-bold tracking-tight">
              Segurança do PIN
            </h1>

            <p className="mt-1 text-[11px] text-white/45">
              Controle de autorizações
            </p>
          </div>
        </header>

        {/* STATUS PRINCIPAL */}
        <section
          className={`rounded-[22px] border p-5 ${
            bloqueado
              ? "border-red-500/25 bg-gradient-to-br from-[#32191D] to-[#191317]"
              : "border-emerald-500/25 bg-gradient-to-br from-[#103327] to-[#0B1D1B]"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                bloqueado
                  ? "bg-red-500/15 text-red-400"
                  : "bg-emerald-500/15 text-emerald-400"
              }`}
            >
              {bloqueado ? (
                <LockKeyhole size={28} />
              ) : (
                <ShieldCheck size={28} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/45">
                Status do PIN gerencial
              </p>

              <h2
                className={`mt-1 text-2xl font-extrabold ${
                  bloqueado
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {bloqueado
                  ? "Bloqueado"
                  : "Liberado"}
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-white/55">
                {bloqueado
                  ? "Novas autorizações estão temporariamente suspensas."
                  : "O sistema está disponível para autorizações."}
              </p>
            </div>
          </div>

          {bloqueado && controle?.bloqueadoAte && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/15 bg-black/20 p-3">
              <Clock3
                size={17}
                className="mt-0.5 shrink-0 text-red-300"
              />

              <p className="text-xs leading-relaxed text-red-100/85">
                Bloqueado até{" "}
                <strong>
                  {formatarData(controle.bloqueadoAte)}
                </strong>
                {" "} (horário de Brasília).
              </p>
            </div>
          )}
        </section>

        {/* INDICADORES */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141D25] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10">
              <ShieldAlert
                size={19}
                className="text-[#F4C75D]"
              />
            </div>

            <p className="text-2xl font-extrabold">
              {tentativasIncorretas}
              <span className="text-sm font-medium text-white/35">
                /5
              </span>
            </p>

            <p className="mt-1 text-[11px] text-white/50">
              Erros consecutivos
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#141D25] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10">
              <History
                size={19}
                className="text-blue-300"
              />
            </div>

            <p className="text-2xl font-extrabold">
              {totalTentativas.toLocaleString("pt-BR")}
            </p>

            <p className="mt-1 text-[11px] text-white/50">
              Tentativas registradas
            </p>
          </div>
        </section>

        {/* CONTROLE ADMINISTRATIVO */}
        <section className="mt-5 rounded-2xl border border-[#F4C75D]/20 bg-[#171D23] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4C75D]/10">
              <KeyRound
                size={20}
                className="text-[#F4C75D]"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold">
                Controle administrativo
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-white/50">
                {bloqueado
                  ? "Você pode desbloquear o PIN antes do término dos 15 minutos."
                  : `Restam ${restantes} tentativas antes do bloqueio.`}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <DesbloquearPinButton
              bloqueado={bloqueado}
              tentativas={tentativasIncorretas}
            />
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-white/35">
            Reiniciar o PIN não libera ingressos e não
            apaga o histórico de tentativas.
          </p>
        </section>

        {/* HISTÓRICO */}
        <section className="mt-7">
          <div className="mb-3">
            <h2 className="text-lg font-bold">
              Histórico de tentativas
            </h2>

            <p className="mt-1 text-xs text-white/40">
              Últimas 100 tentativas registradas
            </p>
          </div>

          {tentativas.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#141D25] px-5 py-10 text-center">
              <History
                size={29}
                className="mx-auto mb-3 text-white/25"
              />

              <p className="text-sm font-semibold">
                Nenhuma tentativa registrada
              </p>

              <p className="mt-2 text-xs text-white/40">
                As tentativas aparecerão aqui
                quando forem realizadas.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tentativas.map((tentativa) => {
                const ingresso = tentativa.ingressoId
                  ? ingressosPorId.get(
                      tentativa.ingressoId
                    )
                  : null;

                const sucesso =
                  tentativa.resultado === "CORRETO";

                const bloqueio =
                  tentativa.resultado === "BLOQUEADO" ||
                  tentativa.resultado ===
                    "LIMITE_ATINGIDO";

                return (
                  <article
                    key={tentativa.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#141D25] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold">
                          Funcionário{" "}
                          {tentativa.funcionarioNumero}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-white/40">
                          {usuariosPorId.get(
                            tentativa.funcionarioId
                          ) ?? "Usuário não encontrado"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                          sucesso
                            ? "bg-emerald-500/10 text-emerald-300"
                            : bloqueio
                              ? "bg-red-500/10 text-red-300"
                              : "bg-amber-400/10 text-amber-300"
                        }`}
                      >
                        {RESULTADOS[
                          tentativa.resultado
                        ] ?? tentativa.resultado}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-white/[0.07] pt-3">
                      <p className="text-[11px] text-white/65">
                        {ingresso?.escola ??
                          "Escola não identificada"}
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-[#F4C75D]">
                        {ingresso?.codigo ??
                          "Ingresso não identificado"}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/35">
                        <Clock3 size={12} />
                        {formatarData(
                          tentativa.criadoEm
                        )}
                      </div>
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

function SegurancaLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080F15] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-[#F4C75D]" />

        <p className="text-xs text-white/50">
          Carregando segurança...
        </p>
      </div>
    </main>
  );
}

export default function SegurancaPage() {
  return (
    <Suspense fallback={<SegurancaLoading />}>
      <SegurancaContent />
    </Suspense>
  );
}
