import { getFirestore } from 'firebase-admin/firestore';
import type { ProgressContext, PerformanceTrend, BaselineRef, RecentSession } from '../types';

const N = 5;

function calcTrend(scores: number[]): PerformanceTrend {
  if (scores.length < 2) return 'stable';
  const deltas = scores.slice(1).map((s, i) => s - scores[i]);
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const maxVariation = Math.max(...scores) - Math.min(...scores);
  if (maxVariation > 15 && Math.abs(avgDelta) < 3) return 'oscillating';
  if (avgDelta > 3) return 'improving';
  if (avgDelta < -3) return 'declining';
  return 'stable';
}

export async function buildProgressContext(
  uid: string,
  attentionType: string,
  currentScore: number
): Promise<ProgressContext | null> {
  const db = getFirestore();

  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) return null;
  const userData = userSnap.data()!;
  if (!userData.onboardingCompleted || !userData.baseline) return null;

  const baselineEntry = userData.baseline[attentionType] as BaselineRef | undefined;
  if (!baselineEntry) return null;

  const sessionsSnap = await db.collection('sessions')
    .where('uid', '==', uid)
    .where('attentionType', '==', attentionType)
    .orderBy('createdAt', 'desc')
    .limit(N)
    .get();

  const recentSessions: RecentSession[] = sessionsSnap.docs.map((d) => {
    const data = d.data();
    return {
      sessionId: d.id,
      score: data.score ?? 0,
      level: data.level ?? 'indeterminado',
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '',
    };
  });

  const historicalScores = [...recentSessions].reverse().map((s) => s.score);
  const trend = calcTrend([...historicalScores, currentScore]);

  return {
    baseline: baselineEntry,
    sessionCount: recentSessions.length,
    recentSessions,
    trend,
    deltaFromBaseline: currentScore - baselineEntry.score,
    firstSessionAfterBaseline: recentSessions.length === 0,
  };
}
