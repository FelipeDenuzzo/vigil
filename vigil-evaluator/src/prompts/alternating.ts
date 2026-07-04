import { Type } from '@google/genai';
import type { AlternatingEvaluatorInput } from '../types';
import { formatMsToSeconds } from './utils';

// ─── Schema de resposta forçado via Structured Output ─────────────────────────
export const ALTERNATING_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Laudo enriquecido de atenção alternada — task-switching — com camadas lúdica, geral e clínica',
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Pontuação global de 0 a 100 coerente com severity.',
    },
    level: {
      type: Type.STRING,
      enum: ['mínimo', 'leve', 'moderado', 'importante'],
      description: 'Classificação clínica coerente com a severidade informada.',
    },
    // ─ Camada geral (leigos) ──────────────────────────────────────────
    generalSummary: {
      type: Type.STRING,
      description: 'Resumo em 2–3 frases em linguagem acessível para alguém sem formação em saúde. Descreva o que aconteceu na sessão de forma encorajadora.',
    },
    generalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2–3 pontos positivos em linguagem simples e encorajadora. Evite termos técnicos.',
    },
    generalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–2 pontos de melhoria em linguagem simples, sem alarmismo. Foque no que pode melhorar com prática.',
    },
    generalRecommendation: {
      type: Type.STRING,
      description: 'Uma orientação prática e encorajadora para o usuário, sem jargões.',
    },
    // ─ Camada clínica (técnica) ──────────────────────────────────────
    clinicalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2–4 aspectos preservados da flexibilidade cognitiva com citação explícita de valores numéricos.',
    },
    clinicalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2–4 fragilidades no controle executivo de troca de regras com citação explícita de valores numéricos.',
    },
    clinicalRecommendation: {
      type: Type.STRING,
      description: 'Orientação objetiva e cautelosa para o avaliador ou equipe clínica. OBRIGATÓRIO: mencionar que é treino, não diagnóstico, e orientar busca por profissional.',
    },
    clinicalNote: {
      type: Type.STRING,
      description: 'Interpretação narrativa técnica articulando switching cost, mixing cost e perseveração em conjunto com citação dos valores. Sem fechar diagnóstico.',
    },
  },
  required: [
    'score', 'level',
    'generalSummary', 'generalStrengths', 'generalWeaknesses', 'generalRecommendation',
    'clinicalStrengths', 'clinicalWeaknesses', 'clinicalRecommendation', 'clinicalNote',
  ],
};

// ─── Prompt clínico — Atenção Alternada ────────────────────────
export function buildAlternatingPrompt(input: AlternatingEvaluatorInput): string {
  const displaySeverity = input.severity === 'minimo' ? 'mínimo' : (input.severity ?? 'indeterminado');
  const isTrilha = input.game === 'trilha-zigue-zague';

  // Configuração específica por jogo
  let gameDescription = '';
  let dimensionsDescription = '';
  let specificData = '';
  let noEngagementWarning = '';

  if (isTrilha) {
    const timePhase1 = input.timePhase1 ?? 0;
    const timePhase2 = input.timePhase2 ?? 0;
    
    noEngagementWarning = (timePhase1 === 0 && timePhase2 === 0)
      ? `
ATENÇÃO — SESSÃO SEM ENGAJAMENTO:
Nenhuma fase foi completada.
- Não faça inferências sobre flexibilidade cognitiva.
- generalStrengths e clinicalStrengths devem ficar vazios.
- generalSummary e clinicalNote devem mencionar que os dados são insuficientes.
`
      : '';

    gameDescription = `O usuário completou o treino "Trilha Zigue-Zague" do Vigil (uma versão do Trail Making Test B).
O usuário precisa conectar alvos alternando entre números e letras em ordem (1-A-2-B-3-C...).`;

    dimensionsDescription = `O instrumento avalia 2 dimensões executivas principais:
1. **Velocidade de Processamento Simples (Fase 1)**: Capacidade basal visomotora e de busca.
2. **Custo de Set-Switching (Fase 2 - Fase 1)**: Atraso causado pela necessidade constante de alternar regras e inibir a sequência natural. Avalia a flexibilidade cognitiva.`;

    specificData = `Métricas globais:
  Tempo Fase 1 (TMT-A): ${timePhase1} segundos
  Tempo Fase 2 (TMT-B): ${timePhase2} segundos
  Custo de Mudança (Switching Cost): ${input.switchCostRtMs ?? (timePhase2 - timePhase1)} segundos

Erros Cometidos (Perseveração e Falha Sequencial):
  Erros de Mudança (Shifting Errors): ${input.shiftingErrors ?? 0} (Falhou em alternar entre número/letra)
  Erros de Sequência (Sequencing Errors): ${input.sequencingErrors ?? 0} (Perdeu a ordem alfabética/numérica)
  Total de Erros: ${input.totalErrors ?? 0}`;

  } else {
    const totalTrials = input.totalTrials ?? 0;
    noEngagementWarning = totalTrials === 0
      ? `
ATENÇÃO — SESSÃO SEM ENGAJAMENTO:
totalTrials é 0. Nenhuma tentativa foi registrada.
- Não faça inferências sobre flexibilidade cognitiva, perseveração ou velocidade.
- generalStrengths e clinicalStrengths devem ficar vazios.
- generalSummary e clinicalNote devem mencionar que os dados são insuficientes.
`
      : '';

    gameDescription = `O usuário completou um treino de task-switching do Vigil ("Cor ou Forma" ou "Insetos")
onde alterna rapidamente regras de classificação ao longo dos estímulos.`;

    dimensionsDescription = `O instrumento avalia 3 dimensões executivas:
1. **Custo de Mudança (Custo de Transição)**: latência extra ao mudar de regra vs. repetir. Avalia flexibilidade cognitiva.
2. **Custo de Mistura (Efeito de Cautela)**: lentidão global na fase mista vs. bloco puro. Avalia sobrecarga da memória de trabalho.
3. **Perseveração**: erros de troca onde a regra anterior foi mantida. Avalia rigidez cognitiva.`;

    specificData = `Métricas globais:
  totalTrials:  ${totalTrials}
  accuracy:     ${input.accuracy ?? 0}%  → ${input.accuracyNote ?? 'indeterminado'}
  avgRtMs:      ${formatMsToSeconds(input.avgRtMs ?? 0)}
  timeouts:     ${input.timeoutCount ?? 0} (${input.timeoutPct ?? 0}%)

Custo de Mudança (Transição):
  switch trials:    ${input.switchTrials ?? 0}
  repeat trials:    ${input.repeatTrials ?? 0}
  switch accuracy:  ${input.switchAccuracy ?? 0}%
  repeat accuracy:  ${input.repeatAccuracy ?? 0}%
  switch RT médio:  ${formatMsToSeconds(input.switchAvgRtMs ?? 0)}
  repeat RT médio:  ${formatMsToSeconds(input.repeatAvgRtMs ?? 0)}
  custo RT:         ${formatMsToSeconds(input.switchCostRtMs ?? 0)}  → ${input.switchingCostNote ?? 'indeterminado'}
  custo erro:       ${input.switchCostErrorPp ?? 0} p.p.

Custo de Mistura (Cautela):
  pure trials:      ${input.pureTrials ?? 0}
  pure accuracy:    ${input.pureAccuracy ?? 0}%
  pure RT médio:    ${formatMsToSeconds(input.pureAvgRtMs ?? 0)}
  custo RT:         ${formatMsToSeconds(input.mixingCostRtMs ?? 0)}  → ${input.mixingCostNote ?? 'indeterminado'}
  custo erro:       ${input.mixingCostErrorPp ?? 0} p.p.

Perseveração:
  erros:   ${input.perseverationErrors ?? 0}
  taxa:    ${input.perseverationPct ?? 0}% dos switch trials  → ${input.perseverationNote ?? 'indeterminado'}

Por regra (blocos puros):
  cor/grupo1   — accuracy: ${input.colorAccuracy ?? 0}%  RT: ${formatMsToSeconds(input.colorAvgRtMs ?? 0)}
  forma/grupo2 — accuracy: ${input.shapeAccuracy ?? 0}%  RT: ${formatMsToSeconds(input.shapeAvgRtMs ?? 0)}`;
  }

  return `
Você é um avaliador especializado em neuropsicologia das funções executivas.
Deve gerar um laudo em DUAS camadas distintas:

│ CAMADA GERAL — para o próprio usuário, sem formação em saúde.
│ Linguagem simples, encorajadora, sem termos técnicos.
│ Campos: generalSummary, generalStrengths, generalWeaknesses, generalRecommendation.
│
│ CAMADA CLÍNICA — para o avaliador ou equipe de saúde.
│ Linguagem técnica, prudente, embasada nos dados numéricos.
│ Campos: clinicalStrengths, clinicalWeaknesses, clinicalRecommendation, clinicalNote.

${gameDescription}

${dimensionsDescription}

REGRAS GERAIS:
- Não recalcule métricas — já processadas pelo sistema local.
- Não feche diagnóstico clínico.
- PROIBIÇÃO DE TERMOS TÉCNICOS: Nas camadas 'general' e 'ludic', NUNCA utilize termos em inglês (como Switching Cost, Mixing Cost, Perseveration, etc). Use explicações simples (ex: "tempo extra para mudar de tarefa").
- FUNDAMENTAÇÃO: na camada clínica, cite explicitamente os valores numéricos (segundos, %).
- NARRATIVA: clinicalNote deve articular os dados numéricos em conjunto (ex: flexibilidade e perseveração).
- severity e notas de custo são verdade absoluta.
- clinicalRecommendation DEVE alertar que os dados vêm de treino virtual (não diagnóstico)
  e orientar busca por profissional certificado.
- score coerente com severity: mínimo→80–100, leve→60–79, moderado→40–59, importante→0–39.
${noEngagementWarning}
─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────────────
sessionId:     ${input.sessionId}
attentionType: alternada
severity (calculada localmente): ${displaySeverity}

${specificData}
───────────────────────────────────────────────────────────────────────────

Gere o laudo com os dois campos de cada camada completamente preenchidos.
`.trim();
}
