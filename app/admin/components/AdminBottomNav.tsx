
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  School,
  Menu,
} from "lucide-react";

const itens = [
  {
    nome: "Painel",
    href: "/admin",
    icone: LayoutDashboard,
  },
  {
    nome: "Histórico",
    href: "/admin/historico",
    icone: History,
  },
  {
    nome: "Escolas",
    href: "/admin/escolas",
    icone: School,
  },
  {
    nome: "Mais",
    href: "/admin/mais",
    icone: Menu,
  },
];

export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu administrativo"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0C141B]/95 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
      style={{
        paddingBottom:
          "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto grid h-[68px] max-w-lg grid-cols-4">
        {itens.map((item) => {
          const ativo =
            item.href === "/admin"
              ? pathname === "/admin"
              : item.href === "/admin/escolas"
                ? pathname.startsWith("/admin/escolas")
                : item.href === "/admin/mais"
                  ? pathname === "/admin/mais" ||
                    pathname.startsWith("/admin/seguranca")
                  : pathname.startsWith(item.href);

          const Icone = item.icone;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 transition ${
                ativo
                  ? "text-[#F4C75D]"
                  : "text-[#85909C] hover:text-white"
              }`}
            >
              {ativo && (
                <span className="absolute top-0 h-[2px] w-9 rounded-full bg-[#F4C75D]" />
              )}

              <Icone
                size={21}
                strokeWidth={ativo ? 2.5 : 1.8}
              />

              <span className="text-[10px] font-semibold">
                {item.nome}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
