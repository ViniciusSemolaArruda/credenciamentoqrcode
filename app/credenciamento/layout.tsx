
import { Suspense, type ReactNode } from "react";
import { requireRole } from "@/lib/auth-guard";

async function CredenciamentoProtegido({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("FUNCIONARIO");

  return <>{children}</>;
}

function CarregandoAutenticacao() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080F15] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-[#F4C75D]" />

        <p className="text-sm text-white/60">
          Verificando acesso ao credenciamento...
        </p>
      </div>
    </main>
  );
}

export default function CredenciamentoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<CarregandoAutenticacao />}>
      <CredenciamentoProtegido>
        {children}
      </CredenciamentoProtegido>
    </Suspense>
  );
}
