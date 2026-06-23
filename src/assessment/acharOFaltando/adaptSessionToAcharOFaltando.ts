// src/assessment/acharOFaltando/adaptSessionToAcharOFaltando.ts
import { MissingItemRoundResult } from '../../attentions/selective/games/AcharOFaltando/types';

/**
 * Adapta os dados brutos salvos durante a sessão do jogo
 * para a estrutura de resultados de rodada esperada.
 */
export function adaptSessionToAcharOFaltando(rawRounds: unknown): MissingItemRoundResult[] {
  if (!Array.isArray(rawRounds)) {
    return [];
  }
  return rawRounds.map((r: any) => ({
    roundNumber: Number(r.roundNumber ?? 0),
    timestampIso: String(r.timestampIso ?? ''),
    gridSize: Number(r.gridSize ?? 8),
    presentationMode: r.presentationMode ?? 'side-by-side',
    layoutMode: r.layoutMode ?? 'grid',
    itemType: r.itemType ?? 'symbols',
    differenceMode: r.differenceMode ?? 'mixed',
    responseMode: r.responseMode ?? 'click-difference',
    differenceCount: Number(r.differenceCount ?? 1),
    targetItems: Array.isArray(r.targetItems) ? r.targetItems.map(String) : [],
    differencePositions: Array.isArray(r.differencePositions) ? r.differencePositions.map(Number) : [],
    response: String(r.response ?? ''),
    correct: Boolean(r.correct),
    hits: Number(r.hits ?? 0),
    omissions: Number(r.omissions ?? 0),
    falsePositives: Number(r.falsePositives ?? 0),
    responseTimeMs: Number(r.responseTimeMs ?? 0),
  }));
}
