
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  XCircle,
  ScanLine,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Users,
  Clock3,
} from "lucide-react";

type StatusIngresso = "DISPONIVEL" | "UTILIZADO" | "CANCELADO";

type ResultadoVerificacao = {
  sucesso: boolean;
  reconhecido?: boolean;
  mensagem?: string;
  tipo?: "ESCOLA" | "CONVIDADO";
  ingresso?: {
    id: string;
    codigo: string;
    numero: number;
    status: StatusIngresso;
    escola?: {
      nome: string;
      sigla?: string | null;
    };
    permiteAcompanhante?: boolean;
    ultimaEntrada?: {
      nome: string;
      sobrenome: string;
      horario: string;
      funcionarioNumero?: number | null;
      comAcompanhante?: boolean;
      acompanhanteNome?: string | null;
      acompanhanteSobrenome?: string | null;
    } | null;
  };
};

function extrairToken(valor: string): string | null {
  const texto = valor.trim();

  if (/^[a-f0-9]{64}$/i.test(texto)) {
    return texto;
  }

  // Aceita também QR Codes que contenham
  // uma URL com o token de 64 caracteres.
  try {
    const url = new URL(texto);

    if (!["https:", "http:"].includes(url.protocol)) {
      return null;
    }

    for (const chave of ["qrToken", "token"]) {
      const token = url.searchParams.get(chave);

      if (token && /^[a-f0-9]{64}$/i.test(token)) {
        return token;
      }
    }

    const partes = url.pathname.split("/").filter(Boolean);
    const ultimo = partes[partes.length - 1];

    if (ultimo && /^[a-f0-9]{64}$/i.test(ultimo)) {
      return ultimo;
    }
  } catch {
    return null;
  }

  return null;
}

function formatarHorario(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

export default function VerificarQRCodePage() {
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [carregandoCamera, setCarregandoCamera] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado] =
    useState<ResultadoVerificacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(
    null
  );

  const ocupadoRef = useRef(false);
  const iniciandoRef = useRef(false);

  const pararCamera = useCallback(async () => {
    const scanner = scannerRef.current;

    scannerRef.current = null;

    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      scanner.clear();
    } catch (error) {
      console.error("Erro ao parar câmera:", error);
    }
  }, []);

  const verificarQRCode = useCallback(
    async (conteudo: string) => {
      if (ocupadoRef.current) return;

      ocupadoRef.current = true;
      setVerificando(true);
      setErro(null);
      setResultado(null);

      const token = extrairToken(conteudo);

      if (!token) {
        setResultado({
          sucesso: true,
          reconhecido: false,
          mensagem: "QR Code inválido ou formato não reconhecido.",
        });

        await pararCamera();
        setCameraAtiva(false);
        setVerificando(false);
        return;
      }

      try {
        await pararCamera();
        setCameraAtiva(false);

        const resposta = await fetch("/api/admin/verificar-qrcode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            qrToken: token,
          }),
        });

        const dados: ResultadoVerificacao = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
          setErro(dados.mensagem || "Erro ao verificar QR Code.");
          return;
        }

        setResultado(dados);
      } catch (error) {
        console.error("Erro na verificação:", error);
        setErro("Não foi possível consultar o QR Code.");
      } finally {
        setVerificando(false);
      }
    },
    [pararCamera]
  );

  const iniciarCamera = useCallback(async () => {
    if (iniciandoRef.current || scannerRef.current) return;

    iniciandoRef.current = true;
    ocupadoRef.current = false;

    setErro(null);
    setResultado(null);
    setCarregandoCamera(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scanner = new Html5Qrcode("leitor-qr-gerente", {
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (largura, altura) => {
            const tamanho = Math.min(largura, altura, 250);

            return {
              width: tamanho,
              height: tamanho,
            };
          },
        },
        (texto) => {
          void verificarQRCode(texto);
        },
        () => {
          // Falhas de leitura entre os frames
          // são normais e não precisam ser exibidas.
        }
      );

      if (scannerRef.current !== scanner) {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
        return;
      }

      setCameraAtiva(true);
    } catch (error) {
      console.error("Erro ao iniciar câmera:", error);

      setErro(
        "Não foi possível acessar a câmera. Verifique a permissão do navegador e utilize HTTPS."
      );

      await pararCamera();
      setCameraAtiva(false);
    } finally {
      iniciandoRef.current = false;
      setCarregandoCamera(false);
    }
  }, [pararCamera, verificarQRCode]);

  useEffect(() => {
    return () => {
      void pararCamera();
    };
  }, [pararCamera]);

  const novaLeitura = async () => {
    await pararCamera();

    ocupadoRef.current = false;
    setResultado(null);
    setErro(null);
    setCameraAtiva(false);

    await iniciarCamera();
  };

  const ingresso = resultado?.ingresso;

  return (
    <main className="relative min-h-dvh bg-[#080F15] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(33,54,61,0.35),transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-lg px-4 pb-10 pt-5">
        {/* CABEÇALHO */}

        <header className="mb-7 flex items-center gap-3">
          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#141D25] transition hover:bg-white/10"
            aria-label="Voltar ao painel"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-[19px] font-bold tracking-tight">
              Verificar QR Code
            </h1>

            <p className="mt-1 text-[11px] text-white/45">
              Consulta de autenticidade dos ingressos
            </p>
          </div>
        </header>

        {/* INFORMAÇÃO */}

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#F4C75D]/20 bg-[#F4C75D]/[0.06] p-4">
          <ShieldCheck
            size={21}
            className="mt-0.5 shrink-0 text-[#F4C75D]"
          />

          <div>
            <p className="text-sm font-semibold text-[#F4C75D]">
              Verificação segura
            </p>

            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Identifique se o QR Code pertence ao sistema e
              consulte sua situação. Esta operação não registra
              entradas nem utiliza o ingresso.
            </p>
          </div>
        </div>

        {/* LEITOR */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121A21]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <ScanLine size={17} className="text-[#F4C75D]" />

              <span className="text-sm font-semibold">
                Leitor de QR Code
              </span>
            </div>

            {cameraAtiva && (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Câmera ativa
              </span>
            )}
          </div>

          <div className="relative min-h-[270px] bg-[#070D12]">
            <div
              id="leitor-qr-gerente"
              className="w-full overflow-hidden [&_video]:w-full [&_video]:object-cover"
            />

            {!cameraAtiva && !carregandoCamera && !verificando && (
              <div className="flex min-h-[270px] flex-col items-center justify-center gap-3 px-5 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#F4C75D]/20 bg-[#F4C75D]/10">
                  <Camera size={30} className="text-[#F4C75D]" />
                </div>

                <p className="text-sm font-semibold">
                  Câmera pronta para iniciar
                </p>

                <p className="max-w-[240px] text-xs leading-relaxed text-white/40">
                  Aponte a câmera para um QR Code do Festival
                  Todo Mundo no Samba.
                </p>
              </div>
            )}

            {(carregandoCamera || verificando) && (
              <div className="flex min-h-[270px] flex-col items-center justify-center gap-3">
                <Loader2
                  size={30}
                  className="animate-spin text-[#F4C75D]"
                />

                <p className="text-xs text-white/55">
                  {verificando
                    ? "Verificando ingresso..."
                    : "Iniciando câmera..."}
                </p>
              </div>
            )}
          </div>

          <div className="p-4">
            {!cameraAtiva && !carregandoCamera && !verificando && (
              <button
                type="button"
                onClick={() => void iniciarCamera()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFE08A] to-[#DCA53D] text-sm font-bold text-[#231A0A] transition hover:brightness-110"
              >
                <Camera size={19} />
                Abrir câmera
              </button>
            )}

            {cameraAtiva && (
              <button
                type="button"
                onClick={() => {
                  void pararCamera().then(() => {
                    setCameraAtiva(false);
                  });
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold"
              >
                Fechar câmera
              </button>
            )}
          </div>
        </section>

        {/* ERRO */}

        {erro && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle size={20} />
              <p className="text-sm font-bold">Erro na verificação</p>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-red-100/70">
              {erro}
            </p>
          </div>
        )}

        {/* RESULTADO */}

        {resultado && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#141D25]">
            <div
              className={`flex items-center gap-3 border-b p-4 ${
                resultado.reconhecido
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-red-500/20 bg-red-500/10"
              }`}
            >
              {resultado.reconhecido ? (
                <CheckCircle2 size={25} className="text-emerald-400" />
              ) : (
                <XCircle size={25} className="text-red-400" />
              )}

              <div>
                <p className="text-sm font-bold">
                  {resultado.reconhecido
                    ? "QR Code reconhecido!"
                    : "QR Code não reconhecido"}
                </p>

                <p className="mt-1 text-xs text-white/55">
                  {resultado.reconhecido
                    ? "Este ingresso pertence ao sistema."
                    : resultado.mensagem ||
                      "Este QR Code não pertence ao sistema."}
                </p>
              </div>
            </div>

            {resultado.reconhecido && ingresso && (
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  {resultado.tipo === "CONVIDADO" ? (
                    <Users size={22} className="text-[#F4C75D]" />
                  ) : (
                    <Ticket size={22} className="text-[#F4C75D]" />
                  )}

                  <div>
                    <p className="text-[11px] text-white/40">
                      Categoria
                    </p>

                    <p className="text-sm font-bold">
                      {resultado.tipo === "CONVIDADO"
                        ? "Convidado + 1 acompanhante"
                        : "Escola de samba"}
                    </p>
                  </div>
                </div>

                {ingresso.escola && (
                  <div>
                    <p className="text-[11px] text-white/40">
                      Escola de samba
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {ingresso.escola.nome}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#0B131A] p-3">
                    <p className="text-[11px] text-white/40">
                      Número
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      {String(ingresso.numero).padStart(3, "0")}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#0B131A] p-3">
                    <p className="text-[11px] text-white/40">
                      Situação
                    </p>

                    <p
                      className={`mt-1 text-sm font-bold ${
                        ingresso.status === "DISPONIVEL"
                          ? "text-emerald-400"
                          : ingresso.status === "UTILIZADO"
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {ingresso.status}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#0B131A] p-3">
                  <p className="text-[11px] text-white/40">
                    Código do ingresso
                  </p>

                  <p className="mt-1 break-all text-xs font-semibold">
                    {ingresso.codigo}
                  </p>
                </div>

                {ingresso.ultimaEntrada && (
                  <div className="rounded-xl border border-white/10 bg-[#0B131A] p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Clock3
                        size={16}
                        className="text-[#F4C75D]"
                      />

                      <p className="text-xs font-bold">
                        Última entrada registrada
                      </p>
                    </div>

                    <p className="text-sm">
                      {ingresso.ultimaEntrada.nome}{" "}
                      {ingresso.ultimaEntrada.sobrenome}
                    </p>

                    <p className="mt-2 text-xs text-white/50">
                      {formatarHorario(
                        ingresso.ultimaEntrada.horario
                      )}
                    </p>

                    {ingresso.ultimaEntrada.funcionarioNumero && (
                      <p className="mt-1 text-xs text-white/50">
                        Funcionário{" "}
                        {ingresso.ultimaEntrada.funcionarioNumero}
                      </p>
                    )}

                    {ingresso.ultimaEntrada.comAcompanhante && (
                      <p className="mt-2 text-xs text-white/70">
                        Acompanhante:{" "}
                        {ingresso.ultimaEntrada.acompanhanteNome}{" "}
                        {ingresso.ultimaEntrada.acompanhanteSobrenome}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* NOVA LEITURA */}

        {(resultado || erro) && !cameraAtiva && !carregandoCamera && (
          <button
            type="button"
            onClick={() => void novaLeitura()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#F4C75D]/30 bg-[#F4C75D]/10 text-sm font-bold text-[#F4C75D]"
          >
            <RefreshCw size={18} />
            Verificar outro QR Code
          </button>
        )}

        <p className="mt-8 text-center text-[10px] text-white/30">
          G.R.E.S. Guardiões da Capadócia
        </p>
      </div>
    </main>
  );
}
