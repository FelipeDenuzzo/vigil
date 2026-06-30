import { Type } from '@google/genai';
import type { SelectiveEvaluatorInput } from '../types';
import { formatMsToSeconds } from './utils';

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
      description: 'Classificação clínica coerente com a severidade informada.',
      enum: ['mínimo', 'leve', 'moderado', 'importante'],
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
  const game = input.game || 'visual-search';
  const displaySeverity = input.severity === 'minimo' ? 'mínimo' : (input.severity ?? 'indeterminado');

  if (game === 'achar-o-faltando') {
    const totalRounds = input.totalRounds ?? 0;
    const noEngagementWarning = totalRounds === 0
      ? `ATENÇÃO — SESSÃO SEM ENGAJAMENTO: totalRounds é 0. O usuário não completou nenhuma rodada. Resuma que os dados são insuficientes em todos os campos.`
      : '';

    return `
Você é um avaliador técnico-clínico de uma tarefa de atenção seletiva chamada "Achar o Faltando".
Neste treino, o usuário deve escanear grades de símbolos, letras ou números e encontrar o elemento discrepante (que está diferente). O teste avança por 10 fases distintas, cada uma com características específicas de complexidade e estímulos visuais.
Deve gerar um laudo em DUAS camadas distintas baseando-se RIGOROSAMENTE nas regras abaixo.

REGRAS ABSOLUTAS DE LINGUAGEM — LEIA ANTES DE TUDO:
- PROIBIÇÃO TOTAL de usar as palavras: "comprometimento", "déficit", "patologia", "diagnóstico", "negligência", "hemi-negligência", "negligência lateral", "negligência espacial", "negligência hemiespacial", "controle inibitório", "lentificação", "lentificação cognitiva", "rastreio visual", "sensibilidade atencional", "flutuação da vigilância", "impulsividade", "varredura caótica", "imaturidade executiva", "atenção lateralizada", "hemicampo", "perfil atencional difuso".
- TOM OBRIGATÓRIO: explique como se fosse para alguém sem formação em saúde. Encorajador e descritivo, nunca alarmista ou clínico. Baseado apenas nesta sessão específica. Use frases como: "o ideal seria...", "nesta sessão foi observado...", "isso pode indicar...".
- NÃO feche diagnóstico.

TABELA DE REFERÊNCIA POR FASE (CALIBRAÇÃO CLÍNICA):
- Fase 1 e 2 (Símbolos Clássicos I/II): Atenção seletiva geral e discriminação visual de símbolos. RT Esperado < 5 segundos.
- Fase 3 (Triângulos e Círculos): Discriminação morfológica simples (forma vs cor). RT Esperado < 4 segundos.
- Fase 4 e 5 (Busca Q/O e O/Q): Discriminação de alto contraste e inibição de distratores de formato similar. RT Esperado < 3 segundos.
- Fase 6 (Busca Serial O/Q com Distratores): Carga atencional moderada, exigindo busca serial entre distratores. RT Esperado < 6 segundos.
- Fase 7 (Dígitos 2/7): Rastreamento simples de numerais similares. RT Esperado < 4 segundos.
- Fase 8 (Busca 2/7 com Distratores): Carga atencional complexa com distratores de dígitos. RT Esperado < 6,5 segundos.
- Fase 9 (Letras Espelhadas d/p): Alta complexidade visuoespacial e discriminação de simetria (d vs p). RT Esperado < 5 segundos.
- Fase 10 (Estímulos Mistos): Flexibilidade cognitiva extrema (Switching). Exige transição rápida entre símbolos, letras e números. RT Esperado < 7 segundos.

GUIA DE INTERPRETAÇÃO DAS FLAGS CLÍNICAS E MÉTRICAS:
- flagImpulsividade: Indica aceleração motora inadequada com erros de comissão nas fases complexas.
- flagLentificacao: Indica lentidão geral nas fases iniciais simples acompanhada de poucas rodadas finalizadas.
- flagSwitchCost: Custo de transição elevado, indicando lentificação marcante na fase mista 10 comparado às fases 8 e 9.
- flagFadigaAtencional: Indica queda severa de consistência (SDRT) e aumento de omissões na segunda metade do treino.
- d' (d-prime): Nível de discriminação de estímulos. Valores > 2.0 indicam excelente sensibilidade discriminativa. < 1.0 indicam dificuldade severa em separar estímulos corretos de distratores.
- PES (Desaceleração Pós-Erro): Aumento do tempo de resposta após cometer um erro, refletindo monitoramento de performance preservado. Valores positivos e moderados (ex: 0,2 a 0,8 segundos) são esperados e normais.

FORMATO E EXIGÊNCIAS POR CAMPO (siga a estrutura de schema):
- generalSummary: 2-3 frases acessíveis sobre o que ocorreu (velocidade, acertos, erros).
- generalStrengths / Weaknesses: Use OBRIGATORIAMENTE os seguintes termos lúdicos para traduzir as métricas pre-calculadas (se estiverem presentes/relevantes):
  * PES adequado -> "Radar de Cautela" ativo (boa recuperação após erro).
  * Fadiga Atencional -> "Fôlego Mental" ou "Resistência" ao longo do treino.
  * Switch Cost -> "Agilidade de Adaptação" (mudança de regras nas fases finais).
  * Lentificação -> "Perfil Estrategista" ou "Analítico" (nunca use "déficit" ou "lento").
- clinicalStrengths / Weaknesses: Cite o que foi avaliado, o ideal por fase, e o que foi observado (compare os RTs reais com a tabela de calibração).
- clinicalNote: Texto corrido com (1) visão geral da atenção seletiva do usuário ao longo das fases, (2) análise de velocidade e acertos utilizando dados numéricos comparados com os esperados, (3) interpretação das flags pré-calculadas fornecidas abaixo (Impulsividade, Lentificação, d', etc.), (4) análise obrigatória da assimetria espacial baseada em spatialAsymmetryDominant e left/right Omissions, (5) o que tudo isso indica clinicamente sem usar termos proibidos e sem dar diagnósticos.

${noEngagementWarning}

─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────
sessionId: ${input.sessionId}
jogo: achar-o-faltando
attentionType: seletiva
severity (calculada localmente): ${displaySeverity}

Métricas globais:
  Total de rodadas: ${totalRounds}
  Rodadas corretas: ${input.totalCorrectRounds ?? 0}
  Acertos (hits): ${input.totalHits ?? 0}
  Omissões (omissions): ${input.totalOmissions ?? 0}
  Falsos positivos: ${input.totalFalsePositives ?? 0}
  Eficiência (acertos/min): ${input.accuracyPerMinute ?? 0}
  Tempo médio de busca: ${formatMsToSeconds(input.averageResponseMs)}
  Estilo de resposta (speedStyle): ${input.speedStyle ?? 'indeterminado'}
  Sinal de fadiga atencional (hasFatigue): ${input.hasFatigue ? 'Sim (declínio na segunda metade)' : 'Não (estável)'}
  Assimetria espacial de omissões (spatialAsymmetryDominant): ${input.spatialAsymmetryDominant ?? 'indeterminado'} (taxa: ${input.asymmetryRatio ?? 0}, omissões esquerda: ${input.leftOmissions ?? 0}, omissões direita: ${input.rightOmissions ?? 0})
  Nota de precisão local: ${input.accuracyNote ?? 'sem nota'}
  Nota de velocidade local: ${input.speedNote ?? 'sem nota'}

Flags clínicas calculadas:
  Flag Impulsividade: ${input.flagImpulsividade ? 'Sim' : 'Não'}
  Flag Lentificação: ${input.flagLentificacao ? 'Sim' : 'Não'}
  Flag Switch Cost: ${input.flagSwitchCost ? 'Sim' : 'Não'}
  Flag Fadiga Atencional: ${input.flagFadigaAtencional ? 'Sim' : 'Não'}

Indicadores de Time-on-Task (Split-Half):
  Primeira metade (Fases 1–5): RT médio: ${formatMsToSeconds(input.firstHalfRtMean)} | SDRT: ${formatMsToSeconds(input.firstHalfSdrt)}
  Segunda metade (Fases 6–10): RT médio: ${formatMsToSeconds(input.secondHalfRtMean)} | SDRT: ${formatMsToSeconds(input.secondHalfSdrt)}

Detalhamento da Performance por Fase:
${(input.phaseMetrics ?? []).map(pm => `
* Fase ${pm.phase} - ${pm.phaseLabel}:
  - Rodadas completadas: ${pm.roundsInPhase}
  - Acertos: ${pm.hits} | Omissões: ${pm.omissions} | Falsos Positivos: ${pm.falsePositives}
  - RT Médio: ${formatMsToSeconds(pm.rtMean)} | SDRT: ${formatMsToSeconds(pm.rtSdrt)} | d' (d-prime): ${pm.dPrime}
  - Desaceleração Pós-Erro (PES): ${pm.postErrorSlowing !== null ? formatMsToSeconds(pm.postErrorSlowing) : 'N/A'}
`).join('\n')}
─────────────────────────────────────────────────────────────────────────────

INSTRUÇÃO CRÍTICA DO SCORE: O score OBRIGATÓRIO desta sessão é de ${input.ludicScore ?? 0}/100. Você NÃO DEVE tentar recalcular ou deduzir o score. Retorne EXATAMENTE este valor numérico na propriedade 'score'.

Gere o laudo nos 3 níveis do schema (pontuação, geral e clínica) rigorosamente seguindo as instruções e proibições de palavras.
`.trim();
  }

  // Jogo default: Visual Search (Caça ao Alvo)
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
- Velocidade de resposta (meanReactionTimeMs): Média de tempo para clicar nos alvos. <0,8 segundos: muito rápido. 0,8 a 1,5 segundos: adequado. 1,5 a 2,5 segundos: um pouco lento. >2,5 segundos: notavelmente lento.
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
  meanReactionTimeMs: ${formatMsToSeconds(input.meanReactionTimeMs)}
  reactionTimeStdDev: ${formatMsToSeconds(input.reactionTimeStdDev)}
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

INSTRUÇÃO CRÍTICA DO SCORE: O score OBRIGATÓRIO desta sessão é de ${input.ludicScore ?? 0}/100. Você NÃO DEVE tentar recalcular ou deduzir o score. Retorne EXATAMENTE este valor numérico na propriedade 'score'.

Gere o laudo nos 3 níveis do schema (pontuação, geral e clínica) rigorosamente seguindo as instruções e proibições de palavras.
`.trim();
}
