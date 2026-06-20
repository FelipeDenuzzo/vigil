// src/assessment/colorShape/adaptSessionToColorShape.ts
// Adaptador puro: converte ColorShapeSessionLog (formato do jogo)
// para ColorShapeAnalysisInput (formato do avaliador interno).
// Apenas os mainTrials importam para avaliação; os de prática são ignorados.

import type { ColorShapeSessionLog } from '../../attentions/alternated/games/ColorShape/types';
import type { ColorShapeAnalysisInput } from './types';

export function adaptSessionToColorShape(
  log: ColorShapeSessionLog
): ColorShapeAnalysisInput {
  return {
    mainTrials: log.mainTrials,
    sessionId:  log.sessionId,
    startedAt:  log.startedAt,
  };
}
