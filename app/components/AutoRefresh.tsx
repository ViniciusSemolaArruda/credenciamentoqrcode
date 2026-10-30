
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshProps = {
  intervalo?: number;
};

export default function AutoRefresh({
  intervalo = 5000,
}: AutoRefreshProps) {
  const router = useRouter();
  const atualizando = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Evitar atualizações quando a aba estiver oculta.
      if (document.visibilityState !== "visible") {
        return;
      }

      if (atualizando.current) {
        return;
      }

      atualizando.current = true;

      router.refresh();

      // router.refresh() não retorna Promise.
      // Esse bloqueio evita disparos consecutivos.
      window.setTimeout(() => {
        atualizando.current = false;
      }, 1000);
    }, intervalo);

    return () => {
      window.clearInterval(timer);
    };
  }, [router, intervalo]);

  return null;
}
