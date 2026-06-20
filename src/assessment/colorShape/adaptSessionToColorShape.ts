// src/assessment/colorShape/adaptSessionToColorShape.ts
// Adaptador puro: converte ColorShapeSessionLog (formato do jogo)
// para ColorShapeAnalysisInput (formato do avaliador interno).

import type { ColorShapeSessionLog } from '../../attentions/alternated/games/ColorShape/types';
import type { ColorShapeAnalysisInput } from './types';

export function adaptSessionToColorShape(
  log: ColorShapeSessionLog
): ColorShapeAnalysisInput {
  return {
    // Blocos separados para cálculo correto do mixing cost
    pureTrials:  [...log.blockATrials, ...log.blockBTrials],
    mixedTrials: log.mixedTrials,
    // mainTrials mantido para compatibilidade com trialSummary
    mainTrials:  log.mainTrials,
    sessionId:   log.sessionId,
    startedAt:   log.startedAt,
  };
}
