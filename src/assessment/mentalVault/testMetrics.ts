// src/assessment/mentalVault/testMetrics.ts

import { calculateRoundMetrics, calculateSessionMetrics } from './calculateMentalVaultMetrics';
import { RegistroRodada } from '../../attentions/divided/games/MentalVault/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("Iniciando testes de métricas do Cofre Mental...");

  // --- Caso 1: Rodada Vazia (Proteção contra Divisão por Zero) ---
  const emptyRound: RegistroRodada = {
    sequenciaAlvo: [],
    sequenciaDigitada: [],
    condicaoRodada: 'pura',
    totalDigitosApresentados: 0,
    tentativas: []
  };
  const emptyMetrics = calculateRoundMetrics(emptyRound);
  assert(emptyMetrics.absoluteRecall === 0, "Absolute recall deve ser 0 para rodada vazia");
  assert(emptyMetrics.digitAccuracy === 0, "Acurácia de dígitos deve ser 0 para rodada vazia");
  assert(emptyMetrics.digitMeanRtMs === 0, "RT médio deve ser 0 para rodada vazia");
  assert(emptyMetrics.digitIes === 0, "IES deve ser 0 para rodada vazia");
  console.log("✅ Proteção contra divisão por zero na rodada validada!");

  // --- Caso 2: Rodada Pura Típica ---
  const round1: RegistroRodada = {
    sequenciaAlvo: ['B', 'C', 'D'],
    sequenciaDigitada: ['B', 'D', 'C'], // 1 acerto na posição (B), 2 erros de posição (C, D trocados)
    condicaoRodada: 'pura',
    totalDigitosApresentados: 4,
    tentativas: [
      {
        indiceTentativa: 1,
        digito: 2,
        corOuRegra: 'padrao',
        respostaCorreta: 'direita',
        respostaUsuario: 'direita',
        acertou: true,
        tipoErro: null,
        tempoReacaoMs: 400
      },
      {
        indiceTentativa: 2,
        digito: 3,
        corOuRegra: 'padrao',
        respostaCorreta: 'esquerda',
        respostaUsuario: 'direita', // erro comissão
        acertou: false,
        tipoErro: 'comissao',
        tempoReacaoMs: 500
      },
      {
        indiceTentativa: 3,
        digito: 4,
        corOuRegra: 'padrao',
        respostaCorreta: 'direita',
        respostaUsuario: 'omissao', // omissão
        acertou: false,
        tipoErro: 'omissao',
        tempoReacaoMs: 750
      },
      {
        indiceTentativa: 4,
        digito: 7,
        corOuRegra: 'padrao',
        respostaCorreta: 'esquerda',
        respostaUsuario: 'esquerda',
        acertou: true,
        tipoErro: null,
        tempoReacaoMs: 600
      }
    ]
  };

  const metrics1 = calculateRoundMetrics(round1);
  // Absolute Recall: 1 acerto / 3 letras = 0.3333
  assert(Math.abs(metrics1.absoluteRecall - 0.3333) < 0.0001, `Absolute recall incorreto: ${metrics1.absoluteRecall}`);
  // Digit Accuracy: 2 acertos / 4 total = 0.5
  assert(metrics1.digitAccuracy === 0.5, `Acurácia incorreta: ${metrics1.digitAccuracy}`);
  // Errors: 1 comissão, 1 omissão
  assert(metrics1.digitCommissionErrors === 1, `Erros de comissão incorretos: ${metrics1.digitCommissionErrors}`);
  assert(metrics1.digitOmissions === 1, `Omissões incorretas: ${metrics1.digitOmissions}`);
  // RT médio das válidas (não omitidas): tentativas 1, 2, 4. TRs: 400, 500, 600. Média = 500
  assert(metrics1.digitMeanRtMs === 500, `RT médio incorreto: ${metrics1.digitMeanRtMs}`);
  // Taxa de precisão: acertos (2) / (total de dígitos (4) + erros de comissão (1)) = 2/5 = 0.4
  assert(metrics1.digitPrecisionRate === 0.4, `Taxa de precisão incorreta: ${metrics1.digitPrecisionRate}`);
  // IES: RT médio (500) / Taxa de precisão (0.4) = 1250
  assert(metrics1.digitIes === 1250, `IES incorreto: ${metrics1.digitIes}`);
  console.log("✅ Rodada pura típica validada com sucesso!");

  // --- Caso 3: Rodada Mista com Recall Perfeito ---
  const round2: RegistroRodada = {
    sequenciaAlvo: ['X', 'Y', 'Z'],
    sequenciaDigitada: ['X', 'Y', 'Z'], // Recall perfeito = 1.0
    condicaoRodada: 'mista',
    totalDigitosApresentados: 2,
    tentativas: [
      {
        indiceTentativa: 1,
        digito: 8,
        corOuRegra: 'azul',
        respostaCorreta: 'direita',
        respostaUsuario: 'direita',
        acertou: true,
        tipoErro: null,
        tempoReacaoMs: 300
      },
      {
        indiceTentativa: 2,
        digito: 3,
        corOuRegra: 'vermelho',
        respostaCorreta: 'esquerda',
        respostaUsuario: 'esquerda',
        acertou: true,
        tipoErro: null,
        tempoReacaoMs: 400
      }
    ]
  };

  const metrics2 = calculateRoundMetrics(round2);
  assert(metrics2.absoluteRecall === 1.0, `Absolute recall incorreto: ${metrics2.absoluteRecall}`);
  assert(metrics2.digitAccuracy === 1.0, `Acurácia incorreta: ${metrics2.digitAccuracy}`);
  assert(metrics2.digitCommissionErrors === 0, `Erros comissão incorretos: ${metrics2.digitCommissionErrors}`);
  assert(metrics2.digitOmissions === 0, `Omissões incorretas: ${metrics2.digitOmissions}`);
  assert(metrics2.digitMeanRtMs === 350, `RT médio incorreto: ${metrics2.digitMeanRtMs}`);
  // Taxa de precisão: acertos (2) / (total (2) + comissao (0)) = 1.0
  assert(metrics2.digitPrecisionRate === 1.0, `Taxa de precisão incorreta: ${metrics2.digitPrecisionRate}`);
  // IES: 350 / 1.0 = 350
  assert(metrics2.digitIes === 350, `IES incorreto: ${metrics2.digitIes}`);
  console.log("✅ Rodada mista típica validada com sucesso!");

  // --- Caso 4: Consolidação da Sessão ---
  const sessionMetrics = calculateSessionMetrics(3, [round1, round2]);
  assert(sessionMetrics.totalRodadas === 2, `Total de rodadas incorreto: ${sessionMetrics.totalRodadas}`);
  assert(sessionMetrics.rodadasPuras === 1, `Rodadas puras incorretas: ${sessionMetrics.rodadasPuras}`);
  assert(sessionMetrics.rodadasMistas === 1, `Rodadas mistas incorretas: ${sessionMetrics.rodadasMistas}`);
  assert(sessionMetrics.nivelMaximo === 3, `Nível máximo incorreto: ${sessionMetrics.nivelMaximo}`);
  
  // avgAbsoluteRecall = (0.3333 + 1.0) / 2 = 0.66665 -> arredondado para 0.6667
  assert(sessionMetrics.avgAbsoluteRecall === 0.6667, `Média recall geral incorreto: ${sessionMetrics.avgAbsoluteRecall}`);
  assert(sessionMetrics.avgAbsoluteRecallPuras === 0.3333, `Média recall puras incorreto: ${sessionMetrics.avgAbsoluteRecallPuras}`);
  assert(sessionMetrics.avgAbsoluteRecallMistas === 1.0, `Média recall mistas incorreto: ${sessionMetrics.avgAbsoluteRecallMistas}`);
  
  // TBRS Cost = 0.3333 - 1.0 = -0.6667
  assert(sessionMetrics.tbrsCost === -0.6667, `TBRS cost incorreto: ${sessionMetrics.tbrsCost}`);

  // avgDigitAccuracy = (0.5 + 1.0) / 2 = 0.75
  assert(sessionMetrics.avgDigitAccuracy === 0.75, `Acurácia dígitos geral incorreta: ${sessionMetrics.avgDigitAccuracy}`);
  assert(sessionMetrics.totalCommissionErrors === 1, `Total comissões acumuladas incorreto: ${sessionMetrics.totalCommissionErrors}`);
  assert(sessionMetrics.totalOmissions === 1, `Total omissões acumuladas incorreto: ${sessionMetrics.totalOmissions}`);
  // avgDigitMeanRtMs = (500 + 350) / 2 = 425
  assert(sessionMetrics.avgDigitMeanRtMs === 425, `Média global RT incorreta: ${sessionMetrics.avgDigitMeanRtMs}`);
  // avgDigitIes = (1250 + 350) / 2 = 800
  assert(sessionMetrics.avgDigitIes === 800, `Média global IES incorreta: ${sessionMetrics.avgDigitIes}`);
  
  console.log("✅ Consolidação de sessão validada com sucesso!");

  // --- Caso 5: Sessão Vazia ---
  const emptySession = calculateSessionMetrics(1, []);
  assert(emptySession.totalRodadas === 0, `Total de rodadas incorreto para sessão vazia`);
  assert(emptySession.avgAbsoluteRecall === 0, `Média recall incorreto para sessão vazia`);
  assert(emptySession.tbrsCost === 0, `TBRS cost incorreto para sessão vazia`);
  assert(emptySession.avgDigitIes === 0, `IES incorreto para sessão vazia`);
  console.log("✅ Proteção contra divisão por zero na sessão validada!");

  console.log("\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!");
}

try {
  runTests();
} catch (e: any) {
  console.error("❌ Teste falhou!");
  console.error(e.message);
  process.exit(1);
}
