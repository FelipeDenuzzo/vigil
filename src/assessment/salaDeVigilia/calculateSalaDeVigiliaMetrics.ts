import { SalaDeVigiliaRawSession, SalaDeVigiliaMetrics } from './types';

export function calculateSalaDeVigiliaMetrics(
  session: SalaDeVigiliaRawSession
): SalaDeVigiliaMetrics {
  const hits = session.events.filter(
    (e) => e.respondedAt !== null && !e.isFalseAlarm
  );
  const omissions = session.events.filter((e) => e.respondedAt === null).length;
  const commissions = session.falseAlarms.length;
  const hitRate = session.totalTargets > 0 ? hits.length / session.totalTargets : 0;

  const rts = hits.map((e) => e.respondedAt! - e.activatedAt);
  const meanRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
  const variance =
    rts.length > 1
      ? rts.reduce((acc, rt) => acc + Math.pow(rt - meanRT, 2), 0) / (rts.length - 1)
      : 0;
  const sdRT = Math.sqrt(variance);

  // Divide sessão em 2 blocos pelo tempo
  const midpoint = session.startedAt + session.durationMs / 2;
  const block1Events = session.events.filter((e) => e.activatedAt < midpoint);
  const block2Events = session.events.filter((e) => e.activatedAt >= midpoint);

  const blockHitRate = (events: typeof session.events) => {
    const h = events.filter((e) => e.respondedAt !== null).length;
    return events.length > 0 ? h / events.length : 0;
  };
  const blockMeanRT = (events: typeof session.events) => {
    const rts = events
      .filter((e) => e.respondedAt !== null)
      .map((e) => e.respondedAt! - e.activatedAt);
    return rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
  };

  const block1HitRate = blockHitRate(block1Events);
  const block2HitRate = blockHitRate(block2Events);
  const block1MeanRT = blockMeanRT(block1Events);
  const block2MeanRT = blockMeanRT(block2Events);

  return {
    omissions,
    commissions,
    hits: hits.length,
    hitRate,
    meanRT,
    sdRT,
    block1HitRate,
    block2HitRate,
    vigilanceDecrement: block1HitRate - block2HitRate,
    block1MeanRT,
    block2MeanRT,
    rtDecrement: block2MeanRT - block1MeanRT,
  };
}
