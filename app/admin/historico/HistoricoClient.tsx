
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History,
  Search,
  Filter,
  TicketCheck,
  UnlockKeyhole,
  Users,
  CalendarClock,
} from "lucide-react";

type Registro = {
  id: string;
  tipo: "ENTRADA" | "LIBERACAO";
  categoriaIngresso?: "ESCOLA" | "INDIVIDUAL" | "IMPRENSA";
  nome: string;
  escola: string;
  codigo: string;
  funcionarioNumero: number | null;
  data: string;
  motivo: string | null;
  gerente: string | null;
};

type Props = {
  registros: Registro[];
  totalEntradas: number;
  totalLiberacoes: number;
  ingressosUtilizados: number;
};

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(data));
}

export default function HistoricoClient({
  registros,
  totalEntradas,
  totalLiberacoes,
  ingressosUtilizados,
}: Props) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [funcionario, setFuncionario] = useState("TODOS");
  const [categoria, setCategoria] = useState("TODOS");

  const registrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return registros.filter((registro) => {
      const correspondeBusca =
        !termo ||
        registro.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        registro.escola.toLocaleLowerCase("pt-BR").includes(termo) ||
        registro.codigo.toLocaleLowerCase("pt-BR").includes(termo) ||
        (registro.motivo ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);

      const correspondeTipo =
        tipo === "TODOS" || registro.tipo === tipo;

      const correspondeFuncionario =
        funcionario === "TODOS" ||
        String(registro.funcionarioNumero) === funcionario;

      const correspondeCategoria =
        categoria === "TODOS" ||
        (registro.categoriaIngresso ?? "ESCOLA") === categoria;

      return (
        correspondeBusca &&
        correspondeTipo &&
        correspondeFuncionario &&
        correspondeCategoria
      );
    });
  }, [registros, busca, tipo, funcionario, categoria]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        {/* CABEÇALHO */}

        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-amber-400"
          >
            <ArrowLeft size={18} />
            Voltar ao painel
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
              <History className="h-7 w-7 text-amber-400" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Painel do gerente
              </p>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Histórico de credenciamento
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Acompanhe as entradas e liberações realizadas
            durante o evento.
          </p>
        </div>

        {/* INDICADORES */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Total de entradas
              </p>

              <Users className="text-blue-400" size={22} />
            </div>

            <p className="text-3xl font-bold">
              {totalEntradas.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Liberações
              </p>

              <UnlockKeyhole
                className="text-amber-400"
                size={22}
              />
            </div>

            <p className="text-3xl font-bold">
              {totalLiberacoes.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Ingressos utilizados
              </p>

              <TicketCheck
                className="text-green-400"
                size={22}
              />
            </div>

            <p className="text-3xl font-bold">
              {ingressosUtilizados.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* FILTROS */}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Filter size={18} className="text-amber-400" />
            Filtros
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, escola, veículo ou código..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="TODOS">Todos os registros</option>
              <option value="ENTRADA">Entradas</option>
              <option value="LIBERACAO">Liberações</option>
            </select>

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="TODOS">Todas as categorias</option>
              <option value="ESCOLA">Escolas de samba</option>
              <option value="INDIVIDUAL">Presidência / Pista</option>
              <option value="IMPRENSA">Imprensa</option>
            </select>

            <select
              value={funcionario}
              onChange={(e) => setFuncionario(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="TODOS">Todos os funcionários</option>
              <option value="1">Funcionário 1</option>
              <option value="2">Funcionário 2</option>
              <option value="3">Funcionário 3</option>
            </select>
          </div>
        </div>

        {/* REGISTROS */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold">
              Registros
            </h2>

            <span className="text-sm text-slate-400">
              {registrosFiltrados.length} encontrados
            </span>
          </div>

          {registrosFiltrados.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <History
                size={42}
                className="mx-auto mb-3 text-slate-600"
              />

              <p className="font-semibold">
                Nenhum registro encontrado
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Tente alterar os filtros ou a busca.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {registrosFiltrados.map((registro) => {
                const imprensa =
                  registro.categoriaIngresso === "IMPRENSA";

                const individual =
                  registro.categoriaIngresso === "INDIVIDUAL";

                const entrada =
                  registro.tipo === "ENTRADA";

                return (
                  <div
                    key={`${registro.tipo}-${registro.categoriaIngresso}-${registro.id}`}
                    className="p-5 transition hover:bg-slate-800/40"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            !entrada
                              ? "bg-amber-400/10 text-amber-400"
                              : imprensa
                                ? "bg-sky-400/10 text-sky-400"
                                : individual
                                  ? "bg-yellow-400/10 text-yellow-400"
                                  : "bg-green-500/10 text-green-400"
                          }`}
                        >
                          {entrada ? (
                            <TicketCheck size={22} />
                          ) : (
                            <UnlockKeyhole size={22} />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {registro.nome}
                            </p>

                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                !entrada
                                  ? "bg-amber-400/10 text-amber-400"
                                  : imprensa
                                    ? "bg-sky-400/10 text-sky-400"
                                    : individual
                                      ? "bg-yellow-400/10 text-yellow-400"
                                      : "bg-green-500/10 text-green-400"
                              }`}
                            >
                              {entrada ? "Entrada" : "Liberação"}
                            </span>

                            {entrada && (
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                  imprensa
                                    ? "bg-sky-400/10 text-sky-400"
                                    : individual
                                      ? "bg-yellow-400/10 text-yellow-400"
                                      : "bg-emerald-400/10 text-emerald-400"
                                }`}
                              >
                                {imprensa
                                  ? "Imprensa"
                                  : individual
                                    ? "Individual"
                                    : "Escola"}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-300">
                            {registro.escola}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Ingresso: {registro.codigo}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            {registro.funcionarioNumero
                              ? `Funcionário ${registro.funcionarioNumero}`
                              : "Funcionário não identificado"}
                          </p>

                          {registro.tipo === "LIBERACAO" && (
                            <div className="mt-3 rounded-lg border border-amber-400/10 bg-amber-400/5 p-3 text-sm">
                              <p className="text-slate-300">
                                <strong>Motivo:</strong>{" "}
                                {registro.motivo}
                              </p>

                              <p className="mt-1 text-slate-400">
                                Autorizado por: {registro.gerente}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                        <CalendarClock size={16} />
                        {formatarData(registro.data)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Os registros são armazenados no PostgreSQL.
        </p>
      </div>
    </main>
  );
}
