import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import db from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

export type AttentionType = 'seletiva' | 'sustentada' | 'alternada' | 'dividida';

export interface BaselineEntry {
  score: number;
  level: string;
  doneAt: string;
}

export interface SessionPoint {
  date: string;       // ISO string
  score: number;
  level: string;
  sessionId: string;
}

export interface AttentionProgress {
  type: AttentionType;
  baseline: BaselineEntry | null;
  sessions: SessionPoint[];          // últimas 20, ordenadas do mais antigo para o mais recente
  bestScore: number | null;
  lastPlayedDate: string | null;     // ISO string
  deltaFromBaseline: number | null;  // média das últimas 5 - baseline
  daysSinceLastPlay: number | null;
}

export interface StreakData {
  current: number;   // dias consecutivos até hoje
  best: number;      // maior streak histórico
}

export interface ProgressData {
  byType: Record<AttentionType, AttentionProgress>;
  streak: StreakData;
  loading: boolean;
  error: string | null;
}

const TYPES: AttentionType[] = ['seletiva', 'sustentada', 'alternada', 'dividida'];

function calcStreak(allDates: string[]): StreakData {
  if (allDates.length === 0) return { current: 0, best: 0 };

  // Datas únicas em dias (yyyy-mm-dd), ordenadas desc
  const uniqueDays = [...new Set(allDates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  let best = 0;
  let streak = 0;
  let prev: string | null = null;

  // Calcula best streak no histórico completo (ordem asc)
  [...uniqueDays].reverse().forEach((day) => {
    if (!prev) { streak = 1; }
    else {
      const diff = (new Date(day).getTime() - new Date(prev).getTime()) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    if (streak > best) best = streak;
    prev = day;
  });

  // Calcula current streak a partir de hoje/ontem
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
    return { current: 0, best };
  }
  current = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = (new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()) / 86400000;
    if (diff === 1) current++;
    else break;
  }

  return { current, best };
}

export function useProgressData(): ProgressData {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>({
    byType: {} as Record<AttentionType, AttentionProgress>,
    streak: { current: 0, best: 0 },
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user?.uid) return;

    (async () => {
      try {
        // Buscar baseline do documento do usuário
        const { getDoc, doc } = await import('firebase/firestore');
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const baseline = userSnap.exists() ? (userSnap.data().baseline ?? {}) : {};

        // Buscar últimas 20 sessões por tipo em paralelo
        const allDates: string[] = [];
        const byType = {} as Record<AttentionType, AttentionProgress>;

        await Promise.all(
          TYPES.map(async (type) => {
            const q = query(
              collection(db, 'sessions'),
              where('uid', '==', user.uid),
              where('attentionType', '==', type),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
            const snap = await getDocs(q);
            const sessions: SessionPoint[] = snap.docs
              .map((d) => {
                const sd = d.data();
                const iso = sd.createdAt?.toDate?.()?.toISOString() ?? '';
                return { date: iso, score: sd.score ?? 0, level: sd.level ?? '', sessionId: d.id };
              })
              .filter((s) => s.date)
              .reverse(); // mais antigo primeiro para o gráfico

            sessions.forEach((s) => allDates.push(s.date));

            const last5 = [...sessions].reverse().slice(0, 5);
            const avg5 = last5.length > 0 ? last5.reduce((a, b) => a + b.score, 0) / last5.length : null;
            const bl: BaselineEntry | null = baseline[type] ?? null;
            const delta = avg5 !== null && bl ? Math.round(avg5 - bl.score) : null;
            const lastDate = sessions.length > 0 ? sessions[sessions.length - 1].date : null;
            const daysSince = lastDate
              ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
              : null;

            byType[type] = {
              type,
              baseline: bl,
              sessions,
              bestScore: sessions.length > 0 ? Math.max(...sessions.map((s) => s.score)) : null,
              lastPlayedDate: lastDate,
              deltaFromBaseline: delta,
              daysSinceLastPlay: daysSince,
            };
          })
        );

        const streak = calcStreak(allDates);
        setData({ byType, streak, loading: false, error: null });
      } catch (err) {
        if (import.meta.env.DEV) console.error('[useProgressData]', err);
        setData((prev) => ({ ...prev, loading: false, error: 'Não foi possível carregar o progresso.' }));
      }
    })();
  }, [user?.uid]);

  return data;
}
