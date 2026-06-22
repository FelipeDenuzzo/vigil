// src/assessment/selectiveListening/adaptSessionToSelectiveListening.ts
import { TentativaRodada } from './types';

/**
 * Adapta os dados brutos salvos durante a sessão do jogo
 * para a estrutura esperada pelo calculador de métricas.
 */
export function adaptSessionToSelectiveListening(rawRounds: unknown): TentativaRodada[] {
  if (!Array.isArray(rawRounds)) {
    return [];
  }
  return rawRounds.map((r: any) => ({
    roundNumber: Number(r.roundNumber ?? 0),
    roundStartAt: String(r.roundStartAt ?? ''),
    targetVoice: r.targetVoice === 'masculina' ? 'masculina' : 'feminina',
    targetDigits: Array.isArray(r.targetDigits) ? r.targetDigits.map(Number) : [],
    distractorDigits: Array.isArray(r.distractorDigits) ? r.distractorDigits.map(Number) : [],
    responseDigits: Array.isArray(r.responseDigits) ? r.responseDigits.map(Number) : [],
    responseLatencyMs: Number(r.responseLatencyMs ?? 0),
    playbackDurationMs: Number(r.playbackDurationMs ?? 0),
    replayCount: Number(r.replayCount ?? 0),
    usedHeadphonesAcknowledged: Boolean(r.usedHeadphonesAcknowledged),
    submitted: Boolean(r.submitted),
    omission: Boolean(r.omission),
  }));
}
