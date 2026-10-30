
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({
  input: stdin,
  output: stdout,
});

const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("\n=== TESTE DE CONCORRÊNCIA ===\n");

  const qrToken = (
    await rl.question("Token do ingresso de teste: ")
  ).trim();

  if (!/^[a-f0-9]{64}$/i.test(qrToken)) {
    throw new Error("Token inválido.");
  }

  const cookie = (
    await rl.question(
      "Cookie de sessão do funcionário: "
    )
  ).trim();

  if (!cookie) {
    throw new Error("Cookie não informado.");
  }

  console.log("\nEnviando duas confirmações...\n");

  async function confirmar(funcionarioNumero) {
    const resposta = await fetch(
      `${BASE_URL}/api/credenciamento/confirmar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          qrToken,
          nome: "Teste",
          sobrenome: `Funcionario${funcionarioNumero}`,
          funcionarioNumero,
        }),
      }
    );

    const dados = await resposta.json();

    return {
      funcionario: funcionarioNumero,
      http: resposta.status,
      sucesso: dados.sucesso,
      mensagem: dados.mensagem,
    };
  }

  const resultados = await Promise.all([
    confirmar(1),
    confirmar(2),
  ]);

  console.table(resultados);

  const aceitas = resultados.filter(
    (resultado) => resultado.sucesso === true
  );

  const recusadas = resultados.filter(
    (resultado) =>
      resultado.http === 409 &&
      resultado.sucesso === false
  );

  if (
    aceitas.length === 1 &&
    recusadas.length === 1
  ) {
    console.log(
      "\n✅ TESTE APROVADO: uma entrada aceita e outra recusada."
    );
  } else {
    console.log(
      "\n⚠️ TESTE INCONCLUSIVO OU REPROVADO."
    );
    console.log(
      "Verifique a autenticação, o estado inicial do ingresso e os resultados."
    );
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error("\nErro:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
}
