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

// ─── Prompt clínico — Atenção Alternada (ColorShape) ────────────────────────
export function buildAlternatingPrompt(input: AlternatingEvaluatorInput): string {
  const displaySeverity = input.severity === 'minimo' ? 'mínimo' : (input.severity ?? 'indeterminado');
  const totalTrials = input.totalTrials ?? 0;

  const noEngagementWarning = totalTrials === 0
    ? `
ATENÇÃO — SESSÃO SEM ENGAJAMENTO:
totalTrials é 0. Nenhuma tentativa foi registrada.
- Não faça inferências sobre flexibilidade cognitiva, perseveração ou velocidade.
- generalStrengths e clinicalStrengths devem ficar vazios.
- generalSummary e clinicalNote devem mencionar que os dados são insuficientes.
`
    : '';

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

O usuário completou o treino "Cor ou Forma" do Vigil — uma tarefa de task-switching
onde alterna entre classificar estímulos pela cor ou pela forma conforme a regra exibida.

O instrumento avalia 3 dimensões executivas:
1. **Switching Cost**: latência extra ao mudar de regra vs. repetir. Avalia flexibilidade cognitiva.
2. **Mixing Cost**: lentidão global na fase mista vs. bloco puro. Avalia sobrecarga da memória de trabalho.
3. **Perseveração**: erros de troca onde a regra anterior foi mantida. Avalia rigidez cognitiva.

REGRAS GERAIS:
- Não recalcule métricas — já processadas pelo sistema local.
- Não feche diagnóstico clínico.
- FUNDAMENTAÇÃO: na camada clínica, cite explicitamente os valores numéricos (segundos, %).
- NARRATIVA: clinicalNote articula as 3 dimensões em conjunto — switching cost alto com perseveração
  conta história diferente de switching cost alto sem perseveração.
- severity e notas de custo são verdade absoluta.
- clinicalRecommendation DEVE alertar que os dados vêm de treino (não diagnóstico)
  e orientar busca por profissional certificado.
- score coerente com severity: mínimo→80–100, leve→60–79, moderado→40–59, importante→0–39.
${noEngagementWarning}
─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────────────
sessionId:     ${input.sessionId}
attentionType: alternada
severity (calculada localmente): ${displaySeverity}

Métricas globais:
  totalTrials:  ${totalTrials}
  accuracy:     ${input.accuracy ?? 0}%  → ${input.accuracyNote ?? 'indeterminado'}
  avgRtMs:      ${formatMsToSeconds(input.avgRtMs)}
  timeouts:     ${input.timeoutCount ?? 0} (${input.timeoutPct ?? 0}%)

Switching Cost:
  switch trials:    ${input.switchTrials ?? 0}
  repeat trials:    ${input.repeatTrials ?? 0}
  switch accuracy:  ${input.switchAccuracy ?? 0}%
  repeat accuracy:  ${input.repeatAccuracy ?? 0}%
  switch RT médio:  ${formatMsToSeconds(input.switchAvgRtMs)}
  repeat RT médio:  ${formatMsToSeconds(input.repeatAvgRtMs)}
  custo RT:         ${formatMsToSeconds(input.switchCostRtMs)}  → ${input.switchingCostNote ?? 'indeterminado'}
  custo erro:       ${input.switchCostErrorPp ?? 0} p.p.

Mixing Cost:
  pure trials:      ${input.pureTrials ?? 0}
  pure accuracy:    ${input.pureAccuracy ?? 0}%
  pure RT médio:    ${formatMsToSeconds(input.pureAvgRtMs)}
  custo RT:         ${formatMsToSeconds(input.mixingCostRtMs)}  → ${input.mixingCostNote ?? 'indeterminado'}
  custo erro:       ${input.mixingCostErrorPp ?? 0} p.p.

Perseveração:
  erros:   ${input.perseverationErrors ?? 0}
  taxa:    ${input.perseverationPct ?? 0}% dos switch trials  → ${input.perseverationNote ?? 'indeterminado'}

Por regra (blocos puros):
  cor   — accuracy: ${input.colorAccuracy ?? 0}%  RT: ${formatMsToSeconds(input.colorAvgRtMs)}
  forma — accuracy: ${input.shapeAccuracy ?? 0}%  RT: ${formatMsToSeconds(input.shapeAvgRtMs)}
───────────────────────────────────────────────────────────────────────────

Gere o laudo com os dois campos de cada camada completamente preenchidos.
`.trim();
}
