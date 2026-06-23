// src/hooks/useAttentionStatus.ts
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import db from '../lib/firebase';

export type AttentionType = 'seletiva' | 'sustentada' | 'alternada' | 'dividida';

export type AttentionStatus =
  | { state: 'loading' }
  | { state: 'never' }
  | { state: 'played'; lastDate: string; bestScore: number | null };

// Mapa com o status de todos os 4 tipos de uma vez
export type AttentionStatusMap = Record<AttentionType, AttentionStatus>;

const ATTENTION_TYPES: AttentionType[] = ['seletiva', 'sustentada', 'alternada', 'dividida'];

async function fetchStatusForType(
  uid: string,
  attentionType: AttentionType
): Promise<AttentionStatus> {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('uid', '==', uid),
      where('attentionType', '==', attentionType),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);

    if (snap.empty) return { state: 'never' };

    const sessions = snap.docs.map((d) => d.data());
    const lastDate = sessions[0]?.createdAt?.toDate?.()
      ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
          .format(sessions[0].createdAt.toDate())
      : null;

    const scores = sessions
      .map((s) => s.score)
      .filter((s): s is number => typeof s === 'number');

    const bestScore = scores.length > 0 ? Math.max(...scores) : null;

    return {
      state: 'played',
      lastDate: lastDate ?? '—',
      bestScore,
    };
  } catch {
    return { state: 'never' };
  }
}

export function useAttentionStatus(uid: string | undefined): AttentionStatusMap {
  const [statusMap, setStatusMap] = useState<AttentionStatusMap>({
    seletiva:  { state: 'loading' },
    sustentada: { state: 'loading' },
    alternada: { state: 'loading' },
    dividida:  { state: 'loading' },
  });

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    async function load() {
      const entries = await Promise.all(
        ATTENTION_TYPES.map(async (type) => [type, await fetchStatusForType(uid!, type)] as const)
      );
      if (!cancelled) {
        setStatusMap(Object.fromEntries(entries) as AttentionStatusMap);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [uid]);

  return statusMap;
}
