// src/evaluators/visualSearch.ts
// Avaliador para o jogo VisualSearchHunt (atenção seletiva)

export interface VisualSearchInput {
  game: 'visual-search';
  sessionId: string;
  attentionType: 'seletiva' | 'sustentada' | 'alternada' | 'dividida';
  roundCount: number;
  totalClicks: number;
  totalHits: number;
  totalTargets: number;
  commissionRate: number;
  dominantErrorAttribute: 'forma' | 'cor' | 'duplo' | 'indeterminado';
  problemRegion: 'esquerda' | 'direita' | 'centro' | 'distribuido' | 'indeterminado';
  spatialNeglect: boolean;
  severity: 'minimo' | 'leve' | 'moderado' | 'importante';
  errorProfile: {
    shapeErrors: number;
    colorErrors: number;
    doubleErrors: number;
    shapeErrorRate: number;
    colorErrorRate: number;
    doubleErrorRate: number;
  };
  spatialProfile: {
    byQuadrant: Record<string, { hits: number; errors: number; errorRate: number }>;
    spatialNeglectSide: string;
    leftMisses: number;
    rightMisses: number;
  };
  avgRtMs?: number;
  ies?: number;
  searchStrategy?: 'organizado' | 'caotico' | 'indeterminado';
  roundProgression?: Array<{
    round: number;
    commissionRate: number;
    avgRtMs: number;
  }>;
}

export interface VisualSearchResult {
  game: 'visual-search';
  sessionId: string;
  severity: string;
  score: number;
  metrics: {
    commissionRate: number;
    dominantErrorAttribute: string;
    problemRegion: string;
    spatialNeglect: boolean;
    errorProfile: VisualSearchInput['errorProfile'];
    spatialProfile: VisualSearchInput['spatialProfile'];
    avgRtMs?: number;
    ies?: number;
    searchStrategy?: string;
    roundProgression?: VisualSearchInput['roundProgression'];
  };
  report: {
    ludic: {
      score: number;
      label: string;
      emoji: string;
    };
    general: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendation: string;
    };
    clinical: {
      strengths: string[];
      weaknesses: string[];
      recommendation: string;
      clinicalNote: string;
    };
    aiClinical?: import('../types').EvaluationReport;
  };
}

const LUDIC_LABEL: Record<VisualSearchInput['severity'], { label: string; emoji: string }> = {
  minimo: { label: 'Excelente!', emoji: '\uD83C\uDF1F' },
  leve: { label: 'Muito bom!', emoji: '\u2B50' },
  moderado: { label: 'Bom progresso!', emoji: '\uD83D\uDC4D' },
  importante: { label: 'Continue tentando!', emoji: '\uD83D\uDCAA' },
};

const DISCLAIMER = 'Aviso: Este resultado reflete o desempenho em uma tarefa de treino e não constitui diagnóstico clínico. Para investigação aprofundada ou dúvidas, procure um profissional de saúde mental certificado pelos conselhos regionais e federais.';

function calculateScore(input: VisualSearchInput): number {
  if (input.totalTargets === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((input.totalHits / input.totalTargets) * 100)));
}

function hasNoEngagement(input: VisualSearchInput): boolean {
  return input.totalClicks === 0;
}

function classifyRt(avgRtMs: number): 'rapido' | 'normal' | 'lento' | 'muito_lento' {
  if (avgRtMs < 600) return 'rapido';
  if (avgRtMs < 1200) return 'normal';
  if (avgRtMs < 2000) return 'lento';
  return 'muito_lento';
}

function detectFatigue(progression: NonNullable<VisualSearchInput['roundProgression']>): boolean {
  if (progression.length < 2) return false;
  const first = progression[0].avgRtMs;
  const last = progression[progression.length - 1].avgRtMs;
  return first > 0 && last >= first * 1.3;
}

function detectImprovement(progression: NonNullable<VisualSearchInput['roundProgression']>): boolean {
  if (progression.length < 2) return false;
  const first = progression[0].commissionRate;
  const last = progression[progression.length - 1].commissionRate;
  return last < first * 0.8;
}

function buildNoEngagementGeneralReport(input: VisualSearchInput): VisualSearchResult['report']['general'] {
  return {
    summary:
      `Não houve cliques durante a tarefa de busca visual. Foram realizados ${input.roundCount} round(s), ` +
      `mas o usuário não interagiu com nenhum alvo ou distrator. Nessa condição, o resultado não permite ` +
      `inferir precisão, padrão de varredura, discriminação de atributos ou distribuição espacial do desempenho.`,
    strengths: [],
    weaknesses: [
      'Ausência completa de resposta motora/comportamental durante a tarefa.',
      'O resultado é inconclusivo para precisão, atenção seletiva visual e perfil espacial, pois não houve amostra mínima de cliques.',
      'A ausência de erros não pode ser interpretada como acerto, controle inibitório preservado ou bom desempenho.',
    ],
    recommendation:
      'Reaplicar a tarefa após verificar compreensão da instrução, engajamento, responsividade motora, funcionamento do input e condições clínicas/comportamentais no momento do teste. ' + DISCLAIMER,
  };
}

function buildGeneralReport(input: VisualSearchInput): VisualSearchResult['report']['general'] {
  if (hasNoEngagement(input)) {
    return buildNoEngagementGeneralReport(input);
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (input.commissionRate < 0.1) {
    strengths.push('Baixa taxa de erros por comissão — boa precisão na seleção de alvos.');
  } else {
    weaknesses.push('Taxa de erros por comissão elevada — dificuldade em inibir respostas incorretas.');
  }

  if (!input.spatialNeglect) {
    strengths.push('Distribuição espacial equilibrada — sem indícios de negligência lateral dentro da amostra observada.');
  } else {
    weaknesses.push(`Possível negligência espacial para o lado ${input.spatialProfile.spatialNeglectSide}.`);
  }

  if (input.dominantErrorAttribute === 'indeterminado' || input.commissionRate < 0.05) {
    strengths.push('Discriminação de atributos visuais (forma e cor) adequada dentro da amostra observada.');
  } else {
    const attr = input.dominantErrorAttribute === 'forma'
      ? 'forma'
      : input.dominantErrorAttribute === 'cor'
      ? 'cor'
      : 'múltiplos atributos';
    weaknesses.push(`Dificuldade predominante na discriminação de ${attr}.`);
  }

  if (input.avgRtMs !== undefined) {
    const rtClass = classifyRt(input.avgRtMs);
    if (rtClass === 'rapido' || rtClass === 'normal') {
      strengths.push(`Tempo de reação médio de ${input.avgRtMs}ms — dentro da faixa esperada.`);
    } else {
      weaknesses.push(`Tempo de reação médio de ${input.avgRtMs}ms — acima do esperado, indicando processamento mais lento.`);
    }
  }

  if (input.searchStrategy && input.searchStrategy !== 'indeterminado') {
    if (input.searchStrategy === 'organizado') {
      strengths.push('Estratégia de varredura visual organizada e sequencial.');
    } else {
      weaknesses.push('Estratégia de varredura visual caótica — sem padrão sequencial identificável.');
    }
  }

  if (input.roundProgression && input.roundProgression.length >= 2) {
    if (detectImprovement(input.roundProgression)) {
      strengths.push('Melhora progressiva entre rounds — boa capacidade de aprendizagem durante a tarefa.');
    }
    if (detectFatigue(input.roundProgression)) {
      weaknesses.push('Aumento do tempo de reação nos rounds finais — indício de fadiga atencional.');
    }
  }

  const recommendation = input.severity === 'minimo'
    ? 'Manter a prática regular para consolidar o desempenho.'
    : input.severity === 'leve'
    ? 'Praticar exercícios de atenção seletiva com foco na discriminação de atributos visuais.'
    : input.severity === 'moderado'
    ? 'Recomenda-se aumento da frequência de treinos e avaliação por profissional de saúde.'
    : 'Avaliação neuropsicológica recomendada para investigação aprofundada.';

  const summary =
    `Desempenho classificado como ${input.severity} em tarefa de busca visual com atenção seletiva, ` +
    `com ${input.totalClicks} clique(s) registrados em ${input.roundCount} round(s).` +
    (input.avgRtMs !== undefined ? ` Tempo de reação médio: ${input.avgRtMs}ms.` : '');

  return { summary, strengths, weaknesses, recommendation: recommendation + ' ' + DISCLAIMER };
}

function buildNoEngagementClinicalReport(input: VisualSearchInput): VisualSearchResult['report']['clinical'] {
  return {
    strengths: [],
    weaknesses: [
      'Ausência total de emissão de resposta durante os 10 rounds da tarefa, configurando protocolo sem engajamento observável.'
        .replace('10', String(input.roundCount)),
      'Nessa condição, não é tecnicamente válido inferir controle inibitório, negligência espacial, velocidade de processamento, estratégia de busca ou discriminação de atributos.',
      'A ausência de cliques pode decorrer de múltiplos fatores não dissociáveis neste protocolo: não compreensão da instrução, recusa/evitação da tarefa, rebaixamento do nível de alerta, lentificação psicomotora acentuada, falha motora/periférica, falha do dispositivo de entrada ou interrupção atencional grave.',
      'O escore de gravidade deve ser interpretado com cautela, pois reflete ausência de resposta, mas não qualifica por si só o mecanismo subjacente dessa ausência.',
    ],
    recommendation:
      'Repetir a avaliação em ambiente controlado, com checagem prévia de compreensão da tarefa, teste do dispositivo de resposta, observação clínica do comportamento durante a execução e, se o padrão persistir, complementar com instrumentos neuropsicológicos e observação funcional. ' + DISCLAIMER,
    clinicalNote:
      'Protocolo inconclusivo para análise fina da atenção seletiva visual. O achado principal não é "baixo desempenho com erros", mas sim ausência de resposta comportamental mensurável, exigindo investigação diferencial antes de qualquer interpretação etiológica definitiva.',
  };
}

function buildClinicalReport(input: VisualSearchInput): VisualSearchResult['report']['clinical'] {
  if (hasNoEngagement(input)) {
    return buildNoEngagementClinicalReport(input);
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (input.commissionRate < 0.1) {
    strengths.push('Controle inibitório preservado — baixo índice de respostas impulsivas dentro da amostra observada.');
  } else {
    weaknesses.push(`Taxa de comissão de ${(input.commissionRate * 100).toFixed(1)}% indica impulsividade ou comprometimento do controle inibitório.`);
  }

  const { shapeErrorRate, colorErrorRate, doubleErrorRate } = input.errorProfile;
  if (shapeErrorRate > 0.4) {
    weaknesses.push('Dificuldade de discriminação de forma sugere comprometimento do processamento ventral (via do "o quê").');
  }
  if (colorErrorRate > 0.4) {
    weaknesses.push('Dificuldade de discriminação de cor pode indicar déficit no processamento cromático pré-atentivo.');
  }
  if (doubleErrorRate > 0.3) {
    weaknesses.push('Alta taxa de erros duplos (forma + cor) sugere comprometimento da atenção seletiva global.');
  }

  if (!input.spatialNeglect) {
    strengths.push('Sem indícios de hemi-negligência espacial dentro da amostra produzida na tarefa.');
  } else {
    weaknesses.push(`Padrão compatível com hemi-negligência ${input.spatialProfile.spatialNeglectSide} — investigação adicional recomendada.`);
  }

  if (input.ies !== undefined) {
    if (input.ies < 1000) {
      strengths.push(`IES de ${input.ies.toFixed(0)}ms — eficiência de busca preservada (precisão e velocidade equilibradas).`);
    } else if (input.ies < 1800) {
      weaknesses.push(`IES de ${input.ies.toFixed(0)}ms — eficiência de busca reduzida; velocidade ou precisão comprometidas.`);
    } else {
      weaknesses.push(`IES de ${input.ies.toFixed(0)}ms — eficiência de busca gravemente reduzida; combinação de lentidão e imprecisão.`);
    }
  }

  if (input.searchStrategy === 'caotico') {
    weaknesses.push('Varredura visual sem estratégia organizada — pode refletir comprometimento da atenção executiva ou déficit de planejamento visuoespacial.');
  } else if (input.searchStrategy === 'organizado') {
    strengths.push('Varredura visual com padrão sequencial — estratégia de busca eficiente preservada.');
  }

  if (input.roundProgression && input.roundProgression.length >= 2) {
    if (detectFatigue(input.roundProgression)) {
      weaknesses.push('Declínio do tempo de reação ao longo dos rounds compatível com fadiga atencional — relevante para avaliação de atenção sustentada.');
    }
    if (detectImprovement(input.roundProgression)) {
      strengths.push('Redução progressiva da taxa de erros entre rounds — efeito de aprendizagem procedimental preservado.');
    }
  }

  const clinicalNote = input.severity === 'importante'
    ? 'O perfil sugere comprometimento importante da atenção seletiva visual, com impacto funcional provável na filtragem de estímulos relevantes, na estabilidade do foco e na eficiência da busca visual. A interpretação deve integrar precisão, velocidade, padrão espacial e progressão ao longo dos rounds.'
    : input.severity === 'moderado'
    ? 'O resultado indica déficit moderado, sugerindo redução mensurável da eficiência de atenção seletiva visual, embora com produção comportamental suficiente para análise qualitativa do padrão de resposta.'
    : 'Resultado dentro de parâmetros utilizáveis para triagem clínica, sem evidência robusta de comprometimento importante no padrão observado.';

  const recommendation =
    input.severity === 'importante' || input.severity === 'moderado'
      ? 'Recomenda-se avaliação neuropsicológica formal com instrumentos padronizados de atenção visual e busca/cancelamento, associando análise comportamental, tempo de resposta, controle inibitório e possível investigação de fatores motores, executivos ou perceptivos conforme a história clínica.'
      : 'Monitoramento longitudinal recomendado. Retestar em 30-60 dias.';

  return { strengths, weaknesses, recommendation: recommendation + ' ' + DISCLAIMER, clinicalNote };
}

export function evaluateVisualSearch(input: VisualSearchInput): VisualSearchResult {
  const score = calculateScore(input);
  const ludicMeta = LUDIC_LABEL[input.severity];

  return {
    game: 'visual-search',
    sessionId: input.sessionId,
    severity: input.severity,
    score,
    metrics: {
      commissionRate: input.commissionRate,
      dominantErrorAttribute: input.dominantErrorAttribute,
      problemRegion: input.problemRegion,
      spatialNeglect: input.spatialNeglect,
      errorProfile: input.errorProfile,
      spatialProfile: input.spatialProfile,
      ...(input.avgRtMs !== undefined && { avgRtMs: input.avgRtMs }),
      ...(input.ies !== undefined && { ies: input.ies }),
      ...(input.searchStrategy !== undefined && { searchStrategy: input.searchStrategy }),
      ...(input.roundProgression !== undefined && { roundProgression: input.roundProgression }),
    },
    report: {
      ludic: {
        score,
        label: ludicMeta.label,
        emoji: ludicMeta.emoji,
      },
      general: buildGeneralReport(input),
      clinical: buildClinicalReport(input),
    },
  };
}
