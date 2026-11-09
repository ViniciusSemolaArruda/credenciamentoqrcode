
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import Image from "next/image";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Flashlight,
  FlashlightOff,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UnlockKeyhole,
  X,
  XCircle,
} from "lucide-react";

// ==========================================
// TIPOS
// ==========================================

type UltimaEntrada = {
  nome: string;
  sobrenome: string;
  horario: string;
};

type Ingresso = {
  id: string;
  codigo: string;
  status: string;

  tipo?: "ESCOLA" | "INDIVIDUAL";
  categoria?: "PRESIDENCIA" | "PISTA" | null;
  numero?: number;
  nomeCategoria?: string;
  permiteAcompanhantes?: boolean;

  escola: {
    nome: string;
  };

  ultimaEntrada?: UltimaEntrada | null;
};

type Tela =
  | "scanner"
  | "formulario"
  | "bloqueado"
  | "cancelado"
  | "liberacao"
  | "sucesso";

// ==========================================
// ESTILOS
// ==========================================

const BOTAO_DOURADO =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFE18A] via-[#F2C65C] to-[#DDA73F] px-4 py-3 text-sm font-bold text-[#261A08] shadow-[0_6px_22px_rgba(225,174,65,0.17)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

const BOTAO_SECUNDARIO =
  "flex min-h-[49px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#141C24]/90 px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-[#1D2933] disabled:opacity-50";

const CAMPO =
  "h-[51px] w-full rounded-xl border border-white/15 bg-[#151E26] px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-[#E7BE69] focus:ring-2 focus:ring-[#E7BE69]/15";

// ==========================================
// IDENTIFICAÇÃO DO INGRESSO
// ==========================================

function ehIndividual(ingresso: Ingresso | null) {
  return ingresso?.tipo === "INDIVIDUAL";
}

function nomeDoIngresso(ingresso: Ingresso) {
  if (ingresso.tipo === "INDIVIDUAL") {
    return ingresso.categoria === "PRESIDENCIA"
      ? "Presidência"
      : "Pista";
  }

  return ingresso.escola.nome;
}

// ==========================================
// CARTÃO DO INGRESSO
// ==========================================

function CartaoIngresso({
  ingresso,
  vermelho = false,
}: {
  ingresso: Ingresso;
  vermelho?: boolean;
}) {
  const individual = ehIndividual(ingresso);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left ${
        vermelho
          ? "border-red-400/15 bg-[#2B1519]/80"
          : "border-white/10 bg-[#18232B]/90"
      }`}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 p-1">
        {individual ? (
          <Ticket size={25} className="text-[#F4C75D]" />
        ) : (
          <Image
            src="/logonova.png"
            alt="Guardiões da Capadócia"
            fill
            sizes="44px"
            className="object-contain p-1"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {individual && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#F4C75D]">
            Ingresso individual
          </p>
        )}

        <p className="truncate text-sm font-semibold text-white">
          {nomeDoIngresso(ingresso)}
        </p>

        <p className="mt-1 text-xs text-white/50">
          {ingresso.codigo}
        </p>

        {individual && (
          <p className="mt-1 text-[11px] text-white/50">
            1 entrada · Sem acompanhantes
          </p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// CARTÃO DA ÚLTIMA ENTRADA
// ==========================================

function CartaoUltimaEntrada({
  entrada,
}: {
  entrada: UltimaEntrada;
}) {
  const data = new Date(entrada.horario);

  const horarioFormatado = Number.isNaN(data.getTime())
    ? "Horário não disponível"
    : new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(data);

  return (
    <div className="mt-4 rounded-2xl border border-red-400/20 bg-[#2B1519]/80 p-5 text-left">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-red-300/75">
        Participante que utilizou o ingresso
      </p>

      <p className="mt-3 break-words text-xl font-bold text-white">
        {entrada.nome} {entrada.sobrenome}
      </p>

      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-xs text-white/45">
          Data e horário da entrada
        </p>

        <p className="mt-1 text-sm font-semibold text-white/80">
          {horarioFormatado}
        </p>

        <p className="mt-1 text-[11px] text-white/40">
          Horário de Brasília
        </p>
      </div>
    </div>
  );
}

// ==========================================
// MOLDURA DO SCANNER
// ==========================================

function MolduraScanner({
  ativa = false,
}: {
  ativa?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-2xl border-l-[3px] border-t-[3px] border-[#F7CF67]" />
      <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-2xl border-r-[3px] border-t-[3px] border-[#F7CF67]" />
      <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-[3px] border-l-[3px] border-[#F7CF67]" />
      <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-2xl border-b-[3px] border-r-[3px] border-[#F7CF67]" />

      {ativa && (
        <div className="absolute inset-x-5 top-1/2 h-px animate-pulse bg-[#F7CF67]/70 shadow-[0_0_14px_3px_rgba(247,207,103,0.35)]" />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function CredenciamentoClient() {
  const router = useRouter();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processandoRef = useRef(false);
  const iniciandoCameraRef = useRef(false);
  const enviandoRef = useRef(false);
  const montadoRef = useRef(false);

  const [funcionario, setFuncionario] = useState("");
  const [tela, setTela] = useState<Tela>("scanner");

  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [iniciandoCamera, setIniciandoCamera] =
    useState(false);

  const [carregando, setCarregando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const [lanternaAtiva, setLanternaAtiva] =
    useState(false);

  const [lanternaDisponivel, setLanternaDisponivel] =
    useState(false);

  const [ingresso, setIngresso] =
    useState<Ingresso | null>(null);

  const [qrToken, setQrToken] = useState("");

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");

  const [motivo, setMotivo] = useState("");
  const [pinGerente, setPinGerente] = useState("");
  const [mostrarPin, setMostrarPin] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [tentativasRestantes, setTentativasRestantes] =
    useState<number | null>(null);

  const [bloqueadoAte, setBloqueadoAte] =
    useState<string | null>(null);

  // ==========================================
  // IDENTIFICAR FUNCIONÁRIO
  // ==========================================

  useEffect(() => {
    montadoRef.current = true;

    const salvo = sessionStorage.getItem(
      "funcionarioSelecionado"
    );

    if (!salvo || !["1", "2", "3"].includes(salvo)) {
      router.replace("/selecionar-funcionario");
    } else {
      setFuncionario(salvo);
    }

    return () => {
      montadoRef.current = false;

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner?.isScanning) {
        void scanner.stop().catch(() => {});
      }
    };
  }, [router]);

  // ==========================================
  // PARAR CÂMERA
  // ==========================================

  const pararCamera = useCallback(async () => {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch {
        // Câmera já encerrada.
      }
    }

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    if (montadoRef.current) {
      setCameraAtiva(false);
      setLanternaAtiva(false);
      setLanternaDisponivel(false);
    }
  }, []);

  // ==========================================
  // LIMPAR DADOS
  // ==========================================

  function limparDados() {
    setIngresso(null);
    setQrToken("");

    setNome("");
    setSobrenome("");

    setMotivo("");
    setPinGerente("");
    setMostrarPin(false);

    setErro("");
    setMensagem("");

    setTentativasRestantes(null);
    setBloqueadoAte(null);
  }

  // ==========================================
  // NOVO CREDENCIAMENTO
  // ==========================================

  async function novoCredenciamento() {
    await pararCamera();

    limparDados();

    processandoRef.current = false;

    setTela("scanner");
  }

  // ==========================================
  // VALIDAR QR CODE
  // ==========================================

  const validarQRCode = useCallback(
    async (token: string) => {
      if (
        processandoRef.current ||
        !montadoRef.current ||
        !token
      ) {
        return;
      }

      processandoRef.current = true;

      setCarregando(true);
      setErro("");
      setMensagem("");

      try {
        await pararCamera();

        const resposta = await fetch(
          "/api/credenciamento/validar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "same-origin",
            cache: "no-store",
            body: JSON.stringify({
              qrToken: token,
            }),
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(
            dados.mensagem ||
              "Não foi possível validar o ingresso."
          );
          return;
        }

        setQrToken(token);
        setIngresso(dados.ingresso);

        if (dados.status === "UTILIZADO") {
          setTela("bloqueado");
          return;
        }

        if (dados.status === "CANCELADO") {
          setTela("cancelado");
          return;
        }

        if (dados.status !== "DISPONIVEL") {
          setErro("Ingresso indisponível.");
          return;
        }

        setTela("formulario");
      } catch {
        setErro(
          "Erro de conexão ao validar o ingresso."
        );
      } finally {
        if (montadoRef.current) {
          setCarregando(false);
        }

        processandoRef.current = false;
      }
    },
    [pararCamera]
  );

  // ==========================================
  // INICIAR CÂMERA
  // ==========================================

  async function iniciarCamera() {
    if (
      cameraAtiva ||
      iniciandoCameraRef.current ||
      processandoRef.current ||
      carregando ||
      !funcionario
    ) {
      return;
    }

    iniciandoCameraRef.current = true;
    setIniciandoCamera(true);

    limparDados();
    setTela("scanner");

    try {
      const scanner = new Html5Qrcode(
        "leitor-qr",
        {
          verbose: false,
        }
      );

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (largura, altura) => {
            const tamanho = Math.min(
              largura * 0.75,
              altura * 0.75,
              250
            );

            return {
              width: Math.max(
                100,
                Math.floor(tamanho)
              ),
              height: Math.max(
                100,
                Math.floor(tamanho)
              ),
            };
          },
          aspectRatio: 1,
          disableFlip: true,
        },
        (texto) => {
          void validarQRCode(texto.trim());
        },
        () => {}
      );

      if (
        processandoRef.current ||
        !montadoRef.current
      ) {
        if (scanner.isScanning) {
          await scanner.stop().catch(() => {});
        }

        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
      } else {
        setCameraAtiva(true);

        try {
          const recursos =
            scanner.getRunningTrackCapabilities();

          setLanternaDisponivel(
            Boolean(
              recursos &&
                "torch" in recursos &&
                recursos.torch
            )
          );
        } catch {
          setLanternaDisponivel(false);
        }
      }
    } catch {
      setErro(
        "Não foi possível abrir a câmera. Verifique as permissões."
      );

      setCameraAtiva(false);
      scannerRef.current = null;
    } finally {
      iniciandoCameraRef.current = false;
      setIniciandoCamera(false);
    }
  }

  // ==========================================
  // LANTERNA
  // ==========================================

  async function alternarLanterna() {
    const scanner = scannerRef.current;

    if (
      !scanner?.isScanning ||
      !lanternaDisponivel
    ) {
      return;
    }

    try {
      const novoEstado = !lanternaAtiva;

      await scanner.applyVideoConstraints({
        advanced: [
          {
            torch: novoEstado,
          } as MediaTrackConstraintSet,
        ],
      });

      setLanternaAtiva(novoEstado);
    } catch {
      setErro(
        "A lanterna não está disponível neste dispositivo."
      );
    }
  }

  // ==========================================
  // CONFIRMAR ENTRADA
  // ==========================================

  async function confirmarEntrada(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (enviandoRef.current) return;

    if (
      !qrToken ||
      !nome.trim() ||
      !sobrenome.trim()
    ) {
      setErro("Preencha nome e sobrenome.");
      return;
    }

    enviandoRef.current = true;

    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch(
        "/api/credenciamento/confirmar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({
            qrToken,
            nome: nome.trim(),
            sobrenome: sobrenome.trim(),
            funcionarioNumero: Number(funcionario),
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 409) {
          const novaConsulta = await fetch(
            "/api/credenciamento/validar",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "same-origin",
              cache: "no-store",
              body: JSON.stringify({ qrToken }),
            }
          )
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);

          if (novaConsulta?.sucesso) {
            setIngresso(novaConsulta.ingresso);

            if (novaConsulta.status === "UTILIZADO") {
              setTela("bloqueado");
            }

            if (novaConsulta.status === "CANCELADO") {
              setTela("cancelado");
            }
          }
        }

        setErro(
          dados.mensagem ||
            "Não foi possível confirmar a entrada."
        );

        return;
      }

      setMensagem(
        "O ingresso foi registrado como utilizado."
      );

      setTela("sucesso");
    } catch {
      setErro(
        "Erro de conexão ao confirmar a entrada."
      );
    } finally {
      enviandoRef.current = false;
      setCarregando(false);
    }
  }

  // ==========================================
  // LIBERAÇÃO GERENCIAL
  // APENAS INGRESSOS DE ESCOLAS
  // ==========================================

  async function liberarIngresso(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (enviandoRef.current) return;

    // Proteção adicional na interface.
    if (ehIndividual(ingresso)) {
      setErro(
        "Ingressos individuais não permitem liberação gerencial."
      );
      return;
    }

    if (
      !qrToken ||
      motivo.trim().length < 5 ||
      !/^\d{8}$/.test(pinGerente)
    ) {
      setErro(
        "Informe o motivo e o PIN de 8 dígitos."
      );
      return;
    }

    enviandoRef.current = true;

    setCarregando(true);
    setErro("");
    setTentativasRestantes(null);
    setBloqueadoAte(null);

    try {
      const resposta = await fetch(
        "/api/credenciamento/liberar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            qrToken,
            funcionarioNumero: Number(funcionario),
            motivo: motivo.trim(),
            pinGerente,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setPinGerente("");
        setMostrarPin(false);

        if (
          typeof dados.tentativasRestantes ===
          "number"
        ) {
          setTentativasRestantes(
            dados.tentativasRestantes
          );
        }

        if (
          typeof dados.bloqueadoAte === "string"
        ) {
          setBloqueadoAte(dados.bloqueadoAte);
        }

        setErro(
          dados.mensagem ||
            "Não foi possível liberar o ingresso."
        );

        return;
      }

      setPinGerente("");
      setMotivo("");
      setMostrarPin(false);

      setTentativasRestantes(null);
      setBloqueadoAte(null);

      setMensagem(
        "Ingresso liberado. Preencha os dados do participante."
      );

      setIngresso((atual) =>
        atual
          ? {
              ...atual,
              status: "DISPONIVEL",
              ultimaEntrada: null,
            }
          : atual
      );

      setTela("formulario");
    } catch {
      setErro(
        "Erro de conexão ao solicitar liberação."
      );
    } finally {
      enviandoRef.current = false;
      setCarregando(false);
    }
  }

  // ==========================================
  // TROCAR FUNCIONÁRIO
  // ==========================================

  async function trocarFuncionario() {
    await pararCamera();
    router.push("/selecionar-funcionario");
  }

  // ==========================================
  // SAIR
  // ==========================================

  async function sair() {
    if (saindo) return;

    setSaindo(true);
    await pararCamera();

    try {
      const resposta = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "same-origin",
        }
      );

      if (!resposta.ok) {
        throw new Error("Falha ao sair.");
      }

      sessionStorage.removeItem(
        "funcionarioSelecionado"
      );

      router.replace("/login");
      router.refresh();
    } catch {
      setErro(
        "Não foi possível sair. Tente novamente."
      );

      setSaindo(false);
    }
  }

  // ==========================================
  // ESTADO DA CÂMERA
  // ==========================================

  const cameraAberta =
    tela === "scanner" &&
    (cameraAtiva || iniciandoCamera);

  const ingressoIndividual = ehIndividual(ingresso);

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#070D12] text-white">
      {/* FUNDO ESCURO PREMIUM */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,#19272D_0%,#0B141A_48%,#05090D_100%)]"
      />

      {/* ILUMINAÇÃO VERDE */}

      {(tela === "sucesso" ||
        tela === "formulario") && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-1/2 top-[15%] h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[95px]"
        />
      )}

      {/* ILUMINAÇÃO VERMELHA */}

      {(tela === "bloqueado" ||
        tela === "cancelado") && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-1/2 top-[12%] h-80 w-80 -translate-x-1/2 rounded-full bg-red-600/[0.16] blur-[100px]"
        />
      )}

      {/* =====================================
          CABEÇALHO
      ===================================== */}

      <header className="relative z-20 shrink-0 border-b border-white/[0.07] bg-black/25 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] w-full max-w-lg items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {tela !== "scanner" ? (
              <button
                type="button"
                onClick={() => {
                  void novoCredenciamento();
                }}
                aria-label="Voltar ao leitor"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#F5CB68] hover:bg-white/10"
              >
                <ArrowLeft size={21} />
              </button>
            ) : (
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src="/logonova.png"
                  alt="Guardiões da Capadócia"
                  fill
                  priority
                  sizes="36px"
                  className="object-contain"
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">
                Funcionário {funcionario || "..."}
              </p>

              <p className="text-[10px] text-white/40">
                Credenciamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={trocarFuncionario}
              disabled={saindo}
              className="text-xs font-semibold text-[#F2C86B] hover:text-[#FFE8A7]"
            >
              Trocar
            </button>

            <button
              type="button"
              onClick={sair}
              disabled={saindo}
              aria-label="Sair da conta"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
            >
              {saindo ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={17} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =====================================
          CONTEÚDO
      ===================================== */}

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-5">
        {/* LEITOR REAL — MANTIDO MONTADO */}

        <div
          className={
            cameraAberta
              ? "relative mb-5 w-full"
              : "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          }
        >
          <div className="relative mx-auto aspect-[3/4] max-h-[min(58dvh,490px)] w-full overflow-hidden rounded-[22px] border border-white/10 bg-black shadow-[0_20px_70px_rgba(0,0,0,0.5)]">
            <div
              id="leitor-qr"
              className="h-full w-full overflow-hidden [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_img]:hidden"
            />

            {/* MOLDURA SOBRE A CÂMERA */}

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative aspect-square w-[70%] max-w-[270px]">
                <MolduraScanner ativa />
              </div>
            </div>

            {/* DEGRADÊ SOBRE A IMAGEM */}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 to-transparent" />

            {/* LANTERNA */}

            {cameraAtiva && lanternaDisponivel && (
              <button
                type="button"
                onClick={alternarLanterna}
                aria-label={
                  lanternaAtiva
                    ? "Desligar lanterna"
                    : "Ligar lanterna"
                }
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-md"
              >
                {lanternaAtiva ? (
                  <FlashlightOff size={19} />
                ) : (
                  <Flashlight size={19} />
                )}
              </button>
            )}

            {/* STATUS DE LEITURA */}

            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-center">
              <Loader2
                size={24}
                className="animate-spin text-[#F6CE6D]"
              />

              <p className="text-sm font-semibold text-white">
                {carregando
                  ? "Validando QR Code..."
                  : "Lendo QR Code..."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void pararCamera();
            }}
            className={`${BOTAO_SECUNDARIO} mt-4`}
          >
            <X size={17} />
            Cancelar
          </button>
        </div>

        {/* =====================================
            SCANNER INICIAL
        ===================================== */}

        {tela === "scanner" && !cameraAberta && (
          <div className="flex flex-1 flex-col items-center justify-center pb-8">
            <div className="relative mb-7 flex aspect-square w-[min(62vw,230px)] items-center justify-center">
              <MolduraScanner />

              <Camera
                size={68}
                strokeWidth={1.2}
                className="text-white/40"
              />
            </div>

            <h1 className="text-center text-[21px] font-bold leading-tight">
              Aponte a câmera
              <span className="block">
                para o QR Code
              </span>
            </h1>

            <p className="mt-3 max-w-[260px] text-center text-xs leading-relaxed text-white/45">
              Posicione o QR Code dentro da moldura
              para iniciar o credenciamento.
            </p>

            <button
              type="button"
              onClick={iniciarCamera}
              disabled={
                iniciandoCamera ||
                carregando ||
                !funcionario
              }
              className={`${BOTAO_DOURADO} mt-8 max-w-[350px]`}
            >
              {iniciandoCamera ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Abrindo câmera...
                </>
              ) : (
                <>
                  <Camera size={19} />
                  Abrir câmera
                </>
              )}
            </button>
          </div>
        )}

        {/* =====================================
            ERROS
        ===================================== */}

        {erro && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {erro}

            {tela === "scanner" &&
              !cameraAberta && (
                <button
                  type="button"
                  onClick={() => setErro("")}
                  className="mt-2 block text-xs font-semibold text-[#F6CE6D]"
                >
                  Fechar aviso
                </button>
              )}
          </div>
        )}

        {/* =====================================
            CARREGAMENTO
        ===================================== */}

        {carregando && tela !== "scanner" && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#E7BE69]/20 bg-[#E7BE69]/10 px-4 py-3 text-xs text-[#F6CE6D]">
            <Loader2
              size={17}
              className="animate-spin"
            />
            Processando solicitação...
          </div>
        )}

        {/* =====================================
            INGRESSO DISPONÍVEL
        ===================================== */}

        {tela === "formulario" && ingresso && (
          <div className="my-auto w-full py-2">
            {/* CARTÃO VERDE */}

            <div className="mb-6 overflow-hidden rounded-[20px] border border-emerald-400/20 bg-gradient-to-br from-[#064B32] via-[#063D2C] to-[#08291F] p-5 shadow-[0_14px_45px_rgba(0,0,0,0.25)]">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22D979] text-[#073C28]">
                  <Check
                    size={17}
                    strokeWidth={3}
                  />
                </div>

                <span className="text-sm font-semibold text-emerald-50">
                  Ingresso disponível
                </span>
              </div>

              {/* IDENTIFICAÇÃO DO TIPO */}

              {ingressoIndividual && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F4C75D]/30 bg-[#F4C75D]/10 px-3 py-1.5">
                  <Ticket
                    size={14}
                    className="text-[#F4C75D]"
                  />

                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F4C75D]">
                    Ingresso individual
                  </span>
                </div>
              )}

              <h1 className="text-xl font-bold leading-snug">
                {nomeDoIngresso(ingresso)}
              </h1>

              {ingressoIndividual && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/15 px-3 py-3">
                  <p className="text-sm font-semibold text-emerald-100">
                    1 entrada por QR Code
                  </p>

                  <p className="mt-1 text-xs text-emerald-100/65">
                    Sem direito a acompanhantes.
                  </p>
                </div>
              )}

              <p className="mt-5 text-[11px] text-emerald-100/60">
                Código do ingresso
              </p>

              <p className="mt-1 text-base font-semibold tracking-wide text-emerald-50">
                {ingresso.codigo}
              </p>
            </div>

            {mensagem && (
              <div className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                {mensagem}
              </div>
            )}

            {/* FORMULÁRIO ORIGINAL */}

            <form
              onSubmit={confirmarEntrada}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="nome"
                  className="mb-2 block text-xs font-semibold text-white/85"
                >
                  Nome
                </label>

                <input
                  id="nome"
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  required
                  maxLength={100}
                  autoComplete="given-name"
                  placeholder="Nome do participante"
                  className={CAMPO}
                />
              </div>

              <div>
                <label
                  htmlFor="sobrenome"
                  className="mb-2 block text-xs font-semibold text-white/85"
                >
                  Sobrenome
                </label>

                <input
                  id="sobrenome"
                  value={sobrenome}
                  onChange={(e) =>
                    setSobrenome(e.target.value)
                  }
                  required
                  maxLength={100}
                  autoComplete="family-name"
                  placeholder="Sobrenome do participante"
                  className={CAMPO}
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#29C96B] to-[#148B43] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_25px_rgba(24,169,80,0.18)] transition hover:brightness-110 disabled:opacity-50"
              >
                {carregando ? (
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={20} />
                )}

                Confirmar entrada
              </button>

              <button
                type="button"
                onClick={() => {
                  void novoCredenciamento();
                }}
                className={BOTAO_SECUNDARIO}
              >
                Cancelar
              </button>
            </form>
          </div>
        )}

        {/* =====================================
            ENTRADA CONFIRMADA
        ===================================== */}

        {tela === "sucesso" && (
          <div className="my-auto w-full py-6 text-center">
            <div className="relative mx-auto mb-7 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-2 rounded-full bg-lime-400/20 blur-[35px]" />

              <div className="absolute inset-4 rounded-full border border-lime-400/30 bg-lime-400/[0.07] shadow-[0_0_35px_rgba(163,230,53,0.2)]" />

              <CheckCircle2
                size={83}
                strokeWidth={1.5}
                className="relative text-[#A7F04A] drop-shadow-[0_0_18px_rgba(163,230,53,0.55)]"
              />

              <span className="absolute left-0 top-7 h-2 w-1 rotate-[-35deg] rounded-full bg-[#F5C95F]" />
              <span className="absolute right-1 top-4 h-2 w-1 rotate-[30deg] rounded-full bg-[#F5C95F]" />
              <span className="absolute bottom-5 left-3 h-1 w-2 rotate-[25deg] rounded-full bg-[#F5C95F]" />
              <span className="absolute bottom-7 right-0 h-2 w-1 rotate-[-20deg] rounded-full bg-[#F5C95F]" />
            </div>

            <h1 className="text-[28px] font-extrabold uppercase leading-tight tracking-tight text-[#A7F04A]">
              Entrada
              <span className="block">
                confirmada!
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-[270px] text-sm leading-relaxed text-white/65">
              O ingresso foi registrado como utilizado.
            </p>

            {ingresso && (
              <div className="mt-7">
                <CartaoIngresso ingresso={ingresso} />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                void novoCredenciamento();
              }}
              className={`${BOTAO_DOURADO} mt-8`}
            >
              Próximo ingresso
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* =====================================
            INGRESSO JÁ UTILIZADO
        ===================================== */}

        {tela === "bloqueado" && (
          <div className="my-auto w-full py-6 text-center">
            <div className="relative mx-auto mb-7 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-2 rounded-full bg-red-500/20 blur-[38px]" />

              <div className="absolute inset-4 rounded-full border border-red-400/30 bg-red-500/[0.06]" />

              <XCircle
                size={83}
                strokeWidth={1.5}
                className="relative text-[#FF5158] drop-shadow-[0_0_18px_rgba(255,81,88,0.5)]"
              />
            </div>

            <h1 className="text-[27px] font-extrabold uppercase leading-tight tracking-tight text-[#FF6668]">
              Ingresso já
              <span className="block">
                utilizado
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-white/65">
              Este QR Code já foi utilizado anteriormente.
            </p>

            {ingresso && (
              <div className="mt-7">
                <CartaoIngresso
                  ingresso={ingresso}
                  vermelho
                />
              </div>
            )}

            {/* IDENTIFICAÇÃO DO PARTICIPANTE */}

            {ingresso?.ultimaEntrada && (
              <CartaoUltimaEntrada
                entrada={ingresso.ultimaEntrada}
              />
            )}

            {ingresso && !ingresso.ultimaEntrada && (
              <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/5 px-4 py-3 text-left">
                <p className="text-xs text-white/60">
                  Não foi encontrado um registro de entrada
                  associado a este ingresso.
                </p>
              </div>
            )}

            {/* LIBERAÇÃO APENAS PARA ESCOLAS */}

            {ingresso && !ingressoIndividual && (
              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setTela("liberacao");
                }}
                className={`${BOTAO_DOURADO} mt-8`}
              >
                <UnlockKeyhole size={19} />
                Solicitar liberação
              </button>
            )}

            {/* INGRESSOS INDIVIDUAIS */}

            {ingressoIndividual && (
              <div className="mt-5 rounded-xl border border-[#F4C75D]/20 bg-[#F4C75D]/5 px-4 py-3 text-left">
                <div className="flex items-start gap-2">
                  <LockKeyhole
                    size={17}
                    className="mt-0.5 shrink-0 text-[#F4C75D]"
                  />

                  <p className="text-xs leading-relaxed text-white/70">
                    Ingresso individual de uso único.
                    Não é permitida uma nova entrada
                    com este QR Code.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                void novoCredenciamento();
              }}
              className={`${BOTAO_SECUNDARIO} mt-3`}
            >
              Ler outro ingresso
            </button>
          </div>
        )}

        {/* =====================================
            INGRESSO CANCELADO
        ===================================== */}

        {tela === "cancelado" && (
          <div className="my-auto w-full py-6 text-center">
            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-[35px]" />

              <XCircle
                size={80}
                strokeWidth={1.5}
                className="relative text-red-400"
              />
            </div>

            <h1 className="text-[26px] font-extrabold uppercase text-red-400">
              Ingresso cancelado
            </h1>

            <p className="mx-auto mt-3 max-w-[300px] text-sm leading-relaxed text-white/60">
              Este ingresso não pode ser utilizado nem
              liberado pelo PIN gerencial.
            </p>

            {ingresso && (
              <div className="mt-7">
                <CartaoIngresso
                  ingresso={ingresso}
                  vermelho
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                void novoCredenciamento();
              }}
              className={`${BOTAO_DOURADO} mt-8`}
            >
              <RefreshCw size={18} />
              Ler outro ingresso
            </button>
          </div>
        )}

        {/* =====================================
            LIBERAÇÃO GERENCIAL
            SOMENTE ESCOLAS
        ===================================== */}

        {tela === "liberacao" &&
          !ingressoIndividual && (
            <div className="my-auto w-full py-4">
              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[#F2C86B]/30 bg-[#F2C86B]/10">
                  <ShieldCheck
                    size={33}
                    className="text-[#F2C86B]"
                  />
                </div>

                <h1 className="text-2xl font-bold">
                  Autorização do gerente
                </h1>

                <p className="mt-2 text-xs text-white/50">
                  Liberação excepcional de ingresso.
                </p>
              </div>

              {ingresso && (
                <div className="mb-5">
                  <CartaoIngresso ingresso={ingresso} />
                </div>
              )}

              {tentativasRestantes !== null &&
                !bloqueadoAte && (
                  <div className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-200">
                    Tentativas restantes:{" "}
                    {tentativasRestantes}
                  </div>
                )}

              {bloqueadoAte && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                  PIN bloqueado até{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(bloqueadoAte))}{" "}
                  (horário de Brasília).
                </div>
              )}

              <form
                onSubmit={liberarIngresso}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="motivo"
                    className="mb-2 block text-xs font-semibold text-white/80"
                  >
                    Motivo da liberação
                  </label>

                  <textarea
                    id="motivo"
                    value={motivo}
                    onChange={(e) =>
                      setMotivo(e.target.value)
                    }
                    required
                    minLength={5}
                    maxLength={500}
                    rows={3}
                    placeholder="Ex.: Substituição de participante"
                    className={`${CAMPO} h-auto min-h-[100px] resize-none py-3`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="pinGerente"
                    className="mb-2 block text-xs font-semibold text-white/80"
                  >
                    PIN especial do gerente
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                    />

                    <input
                      id="pinGerente"
                      type={
                        mostrarPin
                          ? "text"
                          : "password"
                      }
                      inputMode="numeric"
                      autoComplete="off"
                      value={pinGerente}
                      onChange={(e) =>
                        setPinGerente(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 8)
                        )
                      }
                      required
                      minLength={8}
                      maxLength={8}
                      placeholder="8 dígitos"
                      className={`${CAMPO} pl-11 pr-12`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPin(!mostrarPin)
                      }
                      aria-label={
                        mostrarPin
                          ? "Ocultar PIN"
                          : "Mostrar PIN"
                      }
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white/60"
                    >
                      {mostrarPin ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    carregando ||
                    Boolean(
                      bloqueadoAte &&
                        new Date(bloqueadoAte) >
                          new Date()
                    ) ||
                    motivo.trim().length < 5 ||
                    pinGerente.length !== 8
                  }
                  className={BOTAO_DOURADO}
                >
                  {carregando ? (
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <UnlockKeyhole size={19} />
                  )}

                  Autorizar liberação
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPinGerente("");
                    setMotivo("");
                    setErro("");
                    setTela("bloqueado");
                  }}
                  className={BOTAO_SECUNDARIO}
                >
                  <ArrowLeft size={17} />
                  Cancelar
                </button>
              </form>
            </div>
          )}
      </div>
    </main>
  );
}
