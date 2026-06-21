import { Type } from '@google/genai';
import type { SelectiveEvaluatorInput } from '../types';

// ─── Schema de resposta forçado via Structured Output ───────────────────────
export const SELECTIVE_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Laudo enriquecido de atenção seletiva (busca visual) com camadas lúdica, geral e clínica',
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Pontuação global de 0 a 100 refletindo a performance geral.',
    },
    level: {
      type: Type.STRING,
      enum: ['mínimo', 'leve', 'moderado', 'importante'],
      description: 'Classificação clínica coerente com a severidade informada.',
    },
    // ─ Camada geral (leigos) ──────────────────────────────────────────
    generalSummary: {
      type: Type.STRING,
      description: 'Resumo em 2–3 frases em linguagem acessível para alguém sem formação em saúde. O que foi observado em velocidade, acertos e erros.',
    },
    generalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–3 pontos positivos concretos desta sessão, escritos de forma encorajadora.',
    },
    generalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–3 pontos de melhoria desta sessão, descritos sem alarmismo.',
    },
    generalRecommendation: {
      type: Type.STRING,
      description: 'Uma orientação prática e encorajadora para o próximo treino.',
    },
    // ─ Camada clínica (técnica) ──────────────────────────────────────
    clinicalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–4 pontos positivos. Ex: "Precisão: o ideal é X, nesta sessão foi Y, mostrando boa capacidade..."',
    },
    clinicalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–4 pontos de atenção. Ex: "Velocidade: o ideal é responder em menos de 1,5s. Nesta sessão a média foi X..."',
    },
    clinicalRecommendation: {
      type: Type.STRING,
      description: 'Orientação objetiva baseada nos achados, sem jargões.',
    },
    clinicalNote: {
      type: Type.STRING,
      description: 'Texto de 4–6 linhas: (1) visão geral, (2) velocidade e precisão com números, (3) forma de percorrer a tela/erros por região, (4) o que o padrão indica sem jargões e sem diagnóstico.',
    },
  },
  required: [
    'score', 'level',
    'generalSummary', 'generalStrengths', 'generalWeaknesses', 'generalRecommendation',
    'clinicalStrengths', 'clinicalWeaknesses', 'clinicalRecommendation', 'clinicalNote',
  ],
};

// ─── Prompt clínico — Atenção Seletiva ──────────────────────────────────────
export function buildSelectivePrompt(input: SelectiveEvaluatorInput): string {
  const spatialProfile  = input.spatialProfile;
  const errorProfile    = input.errorProfile;
  const commissionRate  = input.commissionRate ?? 0;
  const omissionRate    = input.omissionRate ?? 0;
  const totalClicks     = input.totalClicks ?? 0;

  const neglectInfo = input.spatialNeglect
    ? `Houve assimetria indicando negligência no lado: ${spatialProfile?.spatialNeglectSide ?? 'indeterminado'}.`
    : 'Sem indicadores de assimetria espacial significativa.';

  const quadrantLines = Object.entries(spatialProfile?.byQuadrant ?? {})
    .map(
      ([q, v]) =>
        `  ${q}: ${v.hits} acertos, ${v.errors} erros (taxa ${(v.errorRate * 100).toFixed(1)}%)`
    )
    .join('\n');

  const displaySeverity = input.severity === 'minimo' ? 'mínimo' : (input.severity ?? 'indeterminado');

  const noEngagementWarning = totalClicks === 0
    ? `ATENÇÃO — SESSÃO SEM ENGAJAMENTO MOTOR: totalClicks é 0. O usuário não emitiu respostas. Resuma que os dados são insuficientes em todos os campos.`
    : '';

  return `
Você é um avaliador técnico-clínico de uma tarefa de Busca Visual.
Deve gerar um laudo em DUAS camadas distintas baseando-se RIGOROSAMENTE nas regras abaixo.

REGRAS ABSOLUTAS DE LINGUAGEM — LEIA ANTES DE TUDO:
- PROIBIÇÃO TOTAL de usar as palavras: "comprometimento", "déficit", "patologia", "diagnóstico", "negligência", "hemi-negligência", "negligência lateral", "negligência espacial", "negligência hemiespacial", "controle inibitório", "lentificação", "lentificação cognitiva", "rastreio visual", "sensibilidade atencional", "flutuação da vigilância", "impulsividade", "varredura caótica", "imaturidade executiva", "atenção lateralizada", "hemicampo", "perfil atencional difuso".
- TOM OBRIGATÓRIO: explique como se fosse para alguém sem formação em saúde. Encorajador e descritivo, nunca alarmista ou clínico. Baseado apenas nesta sessão específica. Use frases como: "o ideal seria...", "nesta sessão foi observado...", "isso pode indicar...".
- NÃO feche diagnóstico.

GUIA DE INTERPRETAÇÃO DAS MÉTRICAS:
- Velocidade de resposta (meanReactionTimeMs): Média de tempo para clicar nos alvos. <800ms: muito rápido. 800ms-1500ms: adequado. 1500ms-2500ms: um pouco lento. >2500ms: notavelmente lento.
- Erros por omissão (omissionRate): >20% = muitos alvos passaram despercebidos.
- Cliques em excesso (commissionRate): >15% = clicou em elementos errados.
- Organização da busca (meanOrganizationIndex / predominantScanPattern): próximo de 1.0 ou row-wise/column-wise = organizado. Abaixo de 0.4 ou mixed = pouco organizado.
- Capacidade de distinguir alvos (dPrime): >2.0 = boa distinção. 1.0-2.0 = moderada. <1.0 = dificuldade em identificar elementos corretos.
- Tipos de erro: shapeErrors = confundiu formato; colorErrors = confundiu cor; doubleErrors em alta proporção = cliques incorretos quase aleatórios.
- Distribuição espacial: cite os misses esquerdos/direitos de forma simples (ex: "a maioria dos alvos não clicados estava no lado direito"). NÃO insinue causas neurológicas.

FORMATO E EXIGÊNCIAS POR CAMPO (siga a estrutura de schema):
- generalSummary: 2-3 frases acessíveis sobre o que ocorreu (velocidade, acertos, erros).
- generalStrengths / Weaknesses: Pontos encorajadores / Pontos de melhoria sem alarmismo.
- clinicalStrengths / Weaknesses: Cite o que foi avaliado, o ideal, e o que foi observado (números simples).
- clinicalNote: Texto corrido com (1) visão geral, (2) velocidade e precisão (números), (3) forma de percorrer tela e regiões, (4) o que isso indica sem jargões.

${noEngagementWarning}

─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────
sessionId: ${input.sessionId}
severity (calculada localmente): ${displaySeverity}

Métricas globais:
  totalClicks: ${totalClicks}
  meanReactionTimeMs: ${input.meanReactionTimeMs ?? 'indisponível'} ms
  reactionTimeStdDev: ${input.reactionTimeStdDev ?? 'indisponível'} ms
  commissionRate: ${(commissionRate * 100).toFixed(1)}%
  omissionRate: ${(omissionRate * 100).toFixed(1)}%
  dPrime: ${input.dPrime ?? 'indisponível'}
  meanOrganizationIndex: ${input.meanOrganizationIndex ?? 'indisponível'}
  predominantScanPattern: ${input.predominantScanPattern ?? 'indisponível'}

Perfil de erros (Atributos):
  forma (shapeErrors): ${errorProfile?.shapeErrors ?? 0}
  cor (colorErrors):  ${errorProfile?.colorErrors ?? 0}
  duplos (doubleErrors): ${errorProfile?.doubleErrors ?? 0}
  Dominante: ${input.dominantErrorAttribute ?? 'indeterminado'}

Perfil espacial:
  Problema concentrado na região: ${input.problemRegion ?? 'indeterminado'}
  ${neglectInfo}
  Alvos perdidos à esquerda (leftMisses): ${spatialProfile?.leftMisses ?? 0}
  Alvos perdidos à direita (rightMisses):  ${spatialProfile?.rightMisses ?? 0}

Detalhamento por quadrante:
${quadrantLines}
─────────────────────────────────────────────────────────────────────────────

Gere o laudo nos 3 níveis do schema (pontuação, geral e clínica) rigorosamente seguindo as instruções e proibições de palavras.
`.trim();
}
