
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

const DURACAO_SPLASH = 4;

export default function Home() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const redirecionandoRef = useRef(false);

  const [carregando, setCarregando] = useState(false);

  // ==========================================
  // VERIFICAR SESSÃO E REDIRECIONAR
  // ==========================================

  const redirecionar = useCallback(async () => {
    if (redirecionandoRef.current) {
      return;
    }

    redirecionandoRef.current = true;
    setCarregando(true);

    // Interromper o vídeo antes de navegar.
    videoRef.current?.pause();

    try {
      const resposta = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!resposta.ok) {
        router.replace("/login");
        return;
      }

      const dados = await resposta.json();

      const usuario = dados.usuario ?? null;

      if (usuario?.role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      if (usuario?.role === "FUNCIONARIO") {
        router.replace("/selecionar-funcionario");
        return;
      }

      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // ==========================================
  // INICIAR VÍDEO SEM SOM
  // ==========================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;

    const iniciarVideo = async () => {
      try {
        await video.play();
      } catch {
        // Caso a reprodução seja bloqueada,
        // seguir para a próxima tela.
        void redirecionar();
      }
    };

    void iniciarVideo();
  }, [redirecionar]);

  // ==========================================
  // LIMITAR VÍDEO A 4 SEGUNDOS
  // ==========================================

  function verificarTempo(
    event: React.SyntheticEvent<HTMLVideoElement>
  ) {
    const video = event.currentTarget;

    if (video.currentTime >= DURACAO_SPLASH) {
      video.pause();
      void redirecionar();
    }
  }

  // ==========================================
  // INTERFACE MOBILE FIRST
  // ==========================================

  return (
    <main className="fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-black">
      {/* SPLASH SCREEN */}

      <video
        ref={videoRef}
        src="/splash.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onTimeUpdate={verificarTempo}
        onEnded={() => {
          void redirecionar();
        }}
        onError={() => {
          void redirecionar();
        }}
        className="h-full w-full object-cover"
      />

      {/* CARREGAMENTO */}

      {carregando && (
        <div className="absolute inset-0 flex items-end justify-center bg-black/20 pb-[max(3rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/70 px-5 py-3 shadow-xl backdrop-blur-md">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />

            <span className="text-xs font-medium tracking-wide text-white">
              Iniciando sistema...
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
