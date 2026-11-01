
import Link from "next/link";

import {
  ArrowLeft,
  Database,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const secoes = [
  {
    titulo: "1. Responsável pelo tratamento",
    Icone: UserRound,
    paragrafos: [
      "A G.R.E.S. Guardiões da Capadócia é a organização responsável pelo tratamento dos dados pessoais coletados no sistema de retirada de ingressos do Festival Todo Mundo no Samba.",
      "Esta Política de Privacidade explica quais informações são coletadas, como são utilizadas e quais direitos os participantes podem exercer.",
    ],
  },
  {
    titulo: "2. Dados pessoais coletados",
    Icone: Database,
    paragrafos: [
      "Para realizar a retirada do ingresso, solicitamos o nome completo e o endereço de e-mail do participante.",
      "Também registramos informações relacionadas à retirada, como número e código do ingresso, data do registro e informações necessárias para a validação do QR Code.",
    ],
  },
  {
    titulo: "3. Finalidades do tratamento",
    Icone: FileText,
    paragrafos: [
      "Os dados são utilizados para registrar e administrar a retirada dos ingressos, identificar seus titulares, evitar retiradas duplicadas e permitir a validação na entrada do evento.",
      "O endereço de e-mail poderá ser utilizado para encaminhar o ingresso ou prestar esclarecimentos diretamente relacionados à participação no festival.",
      "Os dados coletados para retirada não serão utilizados automaticamente para campanhas publicitárias ou divulgação de outros eventos.",
    ],
  },
  {
    titulo: "4. Proteção dos dados",
    Icone: LockKeyhole,
    paragrafos: [
      "A organização deverá adotar medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida.",
      "O acesso às informações dos participantes deverá ser restrito às pessoas autorizadas que necessitem delas para administrar os ingressos.",
    ],
  },
  {
    titulo: "5. Armazenamento e compartilhamento",
    Icone: Database,
    paragrafos: [
      "As informações poderão ser armazenadas e processadas por fornecedores de serviços tecnológicos necessários ao funcionamento do sistema, incluindo hospedagem e banco de dados.",
      "Os dados também poderão ser acessados por representantes autorizados da organização responsáveis pelo gerenciamento dos ingressos.",
      "Os dados serão conservados pelo período necessário às finalidades informadas e ao cumprimento de eventuais obrigações legais, sendo eliminados ou anonimizados quando cabível.",
      "O uso de serviços tecnológicos com infraestrutura internacional poderá envolver transferência internacional de dados, observadas as exigências legais aplicáveis.",
    ],
  },
  {
    titulo: "6. Direitos dos participantes",
    Icone: ShieldCheck,
    paragrafos: [
      "Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), o participante poderá solicitar confirmação do tratamento, acesso e correção de seus dados pessoais.",
      "Quando aplicável, poderá solicitar anonimização, bloqueio, eliminação e informações sobre o compartilhamento dos dados, além de exercer os demais direitos previstos em lei.",
      "As solicitações serão avaliadas conforme a legislação, considerando eventuais obrigações legais e necessidades legítimas de conservação.",
    ],
  },
];

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#030913] px-4 py-10 text-white sm:py-16">

      <div className="mx-auto max-w-[850px]">

        {/* VOLTAR */}
        <Link
          href="/escolas/uniao-da-ilha"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#f0c775] transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Voltar para retirada de ingressos
        </Link>

        {/* CABEÇALHO */}
        <header className="rounded-[24px] border border-[#e8bd6c]/40 bg-gradient-to-b from-[#0b1d2d] to-[#07111e] px-5 py-9 text-center shadow-2xl sm:px-10">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#e8bd6c]/50 bg-[#e8bd6c]/10">
            <ShieldCheck
              size={32}
              className="text-[#f0c775]"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#e8bd6c]">
            G.R.E.S. Guardiões da Capadócia
          </p>

          <h1 className="mt-4 font-serif text-3xl font-bold text-[#f9d68b] sm:text-4xl">
            Política de Privacidade
          </h1>

          <p className="mx-auto mt-4 max-w-[600px] text-sm leading-relaxed text-white/70">
            Informações sobre o tratamento dos dados
            pessoais dos participantes do Festival
            Todo Mundo no Samba, conforme a Lei Geral
            de Proteção de Dados Pessoais (LGPD).
          </p>

          <p className="mt-5 text-xs text-white/45">
            Última atualização: novembro de 2026
          </p>

        </header>

        {/* SEÇÕES */}
        <div className="mt-6 space-y-4">

          {secoes.map(({ titulo, Icone, paragrafos }) => (
            <section
              key={titulo}
              className="rounded-2xl border border-white/10 bg-[#0b1d2d]/80 p-5 sm:p-7"
            >

              <div className="flex items-start gap-3">

                <div className="rounded-xl bg-[#e8bd6c]/10 p-2.5">
                  <Icone
                    size={20}
                    className="text-[#f0c775]"
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <h2 className="font-serif text-lg font-bold text-[#f9d68b]">
                    {titulo}
                  </h2>

                  <div className="mt-3 space-y-3">
                    {paragrafos.map((paragrafo) => (
                      <p
                        key={paragrafo}
                        className="text-sm leading-7 text-white/70"
                      >
                        {paragrafo}
                      </p>
                    ))}
                  </div>

                </div>
              </div>

            </section>
          ))}

          {/* CONTATO */}
          <section className="rounded-2xl border border-[#e8bd6c]/40 bg-[#0b1d2d] p-6 sm:p-8">

            <div className="flex items-center gap-3">
              <Mail
                size={23}
                className="text-[#f0c775]"
              />

              <h2 className="font-serif text-xl font-bold text-[#f9d68b]">
                7. Contato sobre dados pessoais
              </h2>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/70">
              Para solicitar acesso, correção ou exclusão
              de dados, quando aplicável, ou esclarecer
              dúvidas sobre esta política, o participante
              poderá entrar em contato com a G.R.E.S.
              Guardiões da Capadócia por meio do canal
              oficial de privacidade.
            </p>

            <div className="mt-5 rounded-xl border border-[#e8bd6c]/20 bg-[#e8bd6c]/5 p-4">

              <p className="text-xs font-semibold text-[#f9d68b]">
                Canal de atendimento LGPD
              </p>

              <p className="mt-2 text-sm text-white/70">
                A organização deverá informar aqui
                um endereço de e-mail oficial para
                solicitações relacionadas aos dados pessoais.
              </p>

            </div>

          </section>

        </div>

        {/* RODAPÉ */}
        <footer className="mt-10 border-t border-white/10 pt-6 text-center">

          <p className="text-sm font-semibold text-[#f0c775]">
            Festival Todo Mundo no Samba
          </p>

          <p className="mt-2 text-xs text-white/50">
            G.R.E.S. Guardiões da Capadócia
          </p>

        </footer>

      </div>
    </main>
  );
}
