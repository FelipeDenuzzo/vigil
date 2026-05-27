// src/assessment/visualSearch/adaptSessionToRoundClicks.ts
// Adaptador puro: converte VisualSearchSessionMetricsInput (formato do módulo do jogo)
// para o formato roundClicks esperado por calculateVisualSearchMetrics (camada central).
// Rodadas sem clicks são ignoradas silenciosamente.

import type { VisualSearchSessionMetricsInput } from '../../attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types';
import type { VisualSearchAnalysisInput } from './types';

export function adaptSessionToRoundClicks(
  session: VisualSearchSessionMetricsInput
): VisualSearchAnalysisInput['roundClicks'] {
  return session.rounds
    .filter((r) => Array.isArray(r.clicks) && r.clicks!.length > 0)
    .map((r) => ({
      round: r.round,
      gridSize: r.gridSize ?? 6,
      clicks: r.clicks!,
      leftSideTargetMisses: r.leftSideTargetMisses,
      rightSideTargetMisses: r.rightSideTargetMisses,
    }));
}
