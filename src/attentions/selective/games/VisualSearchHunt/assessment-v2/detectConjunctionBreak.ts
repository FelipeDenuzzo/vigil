/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/detectConjunctionBreak.ts */
/* Detecção de Colapso em Conjunção (nível 5+) */
/* Atualizado em: 01/06/2026 */

import type { ConjunctionBreakResult, VisualSearchV2SessionLog } from './visualSearchV2.types';

/**
 * Detecta colapso abrupto de desempenho entre nível 4 e nível 5+.
 *
 * Lógica:
 * - earlyLevels: rodadas com level <= 4
 * - laterLevels: rodadas com level >= 5
 * - Se um dos blocos está vazio: detected = false
 * - earlyAvg, laterAvg: médias de accuracyRate
 * - drop = earlyAvg - laterAvg
 * - detected = drop >= 0.25 && earlyAvg >= 0.7
 * - collapseAtLevel: primeira rodada com queda significativa
 */
export function detectConjunctionBreak(sessionLog: VisualSearchV2SessionLog): ConjunctionBreakResult {
  const { rounds } = sessionLog;

  // ── Separar rodadas por nível ──
  const earlyRounds = rounds.filter((r) => r.level <= 4);
  const laterRounds = rounds.filter((r) => r.level >= 5);

  if (earlyRounds.length === 0 || laterRounds.length === 0) {
    return {
      detected: false,
      collapseAtLevel: null,
      shortDescription: 'Dados insuficientes para detectar colapso em conjunção.',
      clinicalMeaning: 'Sessão não atingiu os níveis de conjunção (5+) ou níveis iniciais adequados.',
    };
  }

  // ── Calcular accuracyRate por rodada ──
  const getAccuracyRate = (round: typeof rounds[0]): number => {
    const total = round.hits + round.errors + round.missedTargets;
    return total > 0 ? round.hits / total : 0;
  };

  // ── Médias ──
  const earlyAccuracies = earlyRounds.map(getAccuracyRate);
  const laterAccuracies = laterRounds.map(getAccuracyRate);

  const earlyAvg = earlyAccuracies.reduce((sum, a) => sum + a, 0) / earlyAccuracies.length;
  const laterAvg = laterAccuracies.reduce((sum, a) => sum + a, 0) / laterAccuracies.length;

  const drop = earlyAvg - laterAvg;

  // ── Critério de detecção ──
  const detected = drop >= 0.25 && earlyAvg >= 0.7;

  // ── Encontrar o nível de colapso ──
  let collapseAtLevel: number | null = null;
  if (detected) {
    const threshold = earlyAvg - 0.25;
    for (const round of laterRounds) {
      if (getAccuracyRate(round) < threshold) {
        collapseAtLevel = round.level;
        break;
      }
    }
  }

  // ── Descrição e significado clínico ──
  let shortDescription: string;
  let clinicalMeaning: string;

  if (detected) {
    shortDescription =
      `Colapso detectado em conjunção visual (nível ${collapseAtLevel || 5}+). ` +
      `Queda de ${(drop * 100).toFixed(0)}% no desempenho.`;
    clinicalMeaning =
      'Paciente apresenta dificuldade específica em tarefas de conjunção (busca por combinações de forma e cor). ' +
      'Sugere comprometimento de integração visual ou custo cognitivo elevado de busca conjuntiva.';
  } else {
    shortDescription = 'Sem detecção de colapso em conjunção.';
    clinicalMeaning = 'Desempenho se mantém estável ou melhora na transição para tarefas conjuntivas.';
  }

  return {
    detected,
    collapseAtLevel,
    shortDescription,
    clinicalMeaning,
  };
}
