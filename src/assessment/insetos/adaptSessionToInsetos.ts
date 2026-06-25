// src/assessment/insetos/adaptSessionToInsetos.ts

import type { InsetosSessionData } from './types';
import type { InsetosSessionLog } from '../../attentions/alternating/games/Insetos/types';

export function adaptSessionToInsetos(
  log: InsetosSessionLog
): InsetosSessionData {
  return {
    sessionId: log.sessionId,
    startedAt: log.startedAt,
    rawEvents: log.rawEvents,
  };
}
