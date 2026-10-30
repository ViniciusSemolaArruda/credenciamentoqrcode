
import Image from "next/image";
import Link from "next/link";

import {
  ShieldCheck,
  ChevronRight,
  History,
  School,
  LayoutDashboard,
  Settings2,
} from "lucide-react";

import LogoutButton from "./LogoutButton";

// ==========================================
// OPÇÕES DO MENU ADMINISTRATIVO
// ==========================================

const opcoes = [
  {
    titulo: "Segurança do PIN",
    descricao: "Tentativas de autorização e bloqueios",
    href: "/admin/seguranca",
    icone: ShieldCheck,
  },
  {
    titulo: "Histórico completo",
    descricao: "Entradas e liberações registradas",
    href: "/admin/historico",
    icone: History,
  },
  {
    titulo: "Gerenciar escolas",
    descricao: "Consultar escolas e ingressos",
    href: "/admin/escolas",
    icone: School,
  },
  {
    titulo: "Painel administrativo",
    descricao: "Voltar às estatísticas",
    href: "/admin",
    icone: LayoutDashboard,
  },
];

// ==========================================
// PÁGINA MAIS OPÇÕES
// ==========================================

export default function MaisPage() {
  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      {/* EFEITO DE FUNDO */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-8 pt-5">
        {/* HEADER */}
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
              Mais opções
            </h1>

            <p className="mt-1 text-[11px] text-white/45">
              Administração e segurança do sistema
            </p>
          </div>
        </header>

        {/* TÍTULO DA SEÇÃO */}
        <div className="mb-4 flex items-center gap-2">
          <Settings2
            size={19}
            className="text-[#F4C75D]"
          />

          <h2 className="text-lg font-bold">
            Gerenciamento
          </h2>
        </div>

        {/* LISTA DE OPÇÕES */}
        <section className="space-y-3">
          {opcoes.map((opcao) => {
            const Icone = opcao.icone;

            return (
              <Link
                key={opcao.href}
                href={opcao.href}
                className="group flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#141D25] p-4 transition hover:border-[#F4C75D]/35 hover:bg-[#18232C]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F4C75D]/15 bg-[#F4C75D]/10">
                  <Icone
                    size={21}
                    className="text-[#F4C75D]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white">
                    {opcao.titulo}
                  </h3>

                  <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                    {opcao.descricao}
                  </p>
                </div>

                <ChevronRight
                  size={18}
                  className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-[#F4C75D]"
                />
              </Link>
            );
          })}
        </section>

        {/* SAIR DA CONTA */}
        <section className="mt-7">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
            Sessão
          </h2>

          <LogoutButton />
        </section>

        {/* RODAPÉ */}
        <div className="mt-8 border-t border-white/[0.08] pt-5 text-center">
          <p className="text-[11px] font-medium text-white/45">
            Sistema de Credenciamento
          </p>

          <p className="mt-1 text-[10px] text-white/25">
            G.R.E.S. Guardiões da Capadócia
          </p>
        </div>
      </div>
    </main>
  );
}
