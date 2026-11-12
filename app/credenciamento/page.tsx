import { Suspense } from "react";
import CredenciamentoClient from "./CredenciamentoClient";

export const instant = false;

function CredenciamentoLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080F15] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-[#F4C75D]" />

        <p className="text-sm text-white/60">
          Carregando credenciamento...
        </p>
      </div>
    </main>
  );
}

export default function CredenciamentoPage() {
  return (
    <Suspense fallback={<CredenciamentoLoading />}>
      <CredenciamentoClient />
    </Suspense>
  );
}