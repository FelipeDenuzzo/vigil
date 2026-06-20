// Artefato 4 — Container de apresentação do laudo LongMazes

import { useEffect, useRef, useState } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';
import { useLongMazesEvaluation } from './useLongMazesEvaluation';
import type { LongMazesEvaluationResult } from './useLongMazesEvaluation';
import type { MazeFullSessionLog } from './types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { LongMazesEvaluationLoadingAnimation } from './LongMazesEvaluationLoadingAnimation';
import { LongMazesReportPanel } from './LongMazesReportPanel';

type LoadedState = false | 'organizing' | true;

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

async function saveReportToFirestore(sessionId: string, report: EvaluationReport): Promise<void> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    await setDoc(ref, { geminiReport: report, sessionId, savedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('[LongMazes] Falha ao salvar no Firestore:', err);
  }
}

async function loadReportFromFirestore(sessionId: string): Promise<EvaluationReport | null> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.geminiReport) return data.geminiReport as EvaluationReport;
    }
    return null;
  } catch (err: any) {
    if (RETRYABLE_CODES.has(err?.code)) {
      try {
        await new Promise(r => setTimeout(r, 2000));
        const ref = doc(db, 'sessionReports', sessionId);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data()?.geminiReport) return snap.data()!.geminiReport as EvaluationReport;
        return null;
      } catch { return null; }
    }
    console.warn('[LongMazes] Falha ao carregar do Firestore:', err);
    return null;
  }
}

interface Props {
  log: MazeFullSessionLog;
  sessionId: string;
  onRepeat?: () => void;
  onBack?: () => void;
}

export function LongMazesEvaluationContainer({ log, sessionId, onRepeat, onBack }: Props) {
  const [result,       setResult]       = useState<LongMazesEvaluationResult | null>(null);
  const [geminiReport, setGeminiReport] = useState<EvaluationReport | null>(null);
  const [loaded,       setLoaded]       = useState<LoadedState>(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      setLoaded(false);

      // 1️⃣ Verifica cache no Firestore
      const cached = await loadReportFromFirestore(sessionId);
      if (cached) {
        // cache só tem o laudo Gemini — ainda precisamos calcular as métricas localmente
        const { calculateLongMazesMetrics } = await import('../../../../assessment/longMazes/calculateLongMazesMetrics');
        const metrics = calculateLongMazesMetrics(log);
        setResult({ metrics, geminiReport: cached });
        setGeminiReport(cached);
        setLoaded(true);
        return;
      }

      // 2️⃣ Chama avaliador interno + Gemini
      let res: LongMazesEvaluationResult | null = null;
      try {
        res = await useLongMazesEvaluation(log, sessionId);
      } catch (err) {
        console.warn('[LongMazes] Erro na avaliação:', err);
      }

      setResult(res);
      setLoaded('organizing');

      if (res?.geminiReport) {
        await saveReportToFirestore(sessionId, res.geminiReport);
        setGeminiReport(res.geminiReport);
      }

      setLoaded(true);
    })();
  }, [log, sessionId]);

  // Loading
  if (loaded === false || loaded === 'organizing') {
    return (
      <div style={s.screen}>
        <LongMazesEvaluationLoadingAnimation
          phase={loaded === false ? 'analyzing' : 'organizing'}
        />
      </div>
    );
  }

  // Sem laudo Gemini — exibe apenas dados internos
  if (!geminiReport || !result) {
    const metrics = result?.metrics;
    return (
      <div style={s.screen}>
        <p style={s.title}>🧩 Treino concluído</p>
        {metrics && (
          <div style={s.fallbackBox}>
            <p style={s.fallbackLine}>Fases concluídas: <b>{metrics.completedPhases}/{metrics.phases.length}</b></p>
            <p style={s.fallbackLine}>Eficiência média: <b>{metrics.avgEfficiencyPct}%</b></p>
            <p style={s.fallbackLine}>Revisitas totais: <b>{metrics.totalRevisits}</b></p>
            <p style={s.fallbackLine}>Nível: <b>{metrics.severity}</b></p>
          </div>
        )}
        <p style={s.sub}>Avaliação detalhada indisponível no momento.</p>
        {onRepeat && <button style={s.btn} onClick={onRepeat}>↺ Repetir treino</button>}
        {onBack   && <button style={s.btnBack} onClick={onBack}>Voltar</button>}
      </div>
    );
  }

  // Laudo completo
  return (
    <div style={s.screen}>
      <p style={s.title}>🏆 Resultado do treino</p>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <LongMazesReportPanel
          report={geminiReport}
          metrics={result.metrics}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {onRepeat && <button style={s.btn}     onClick={onRepeat}>↺ Repetir treino</button>}
        {onBack   && <button style={s.btnBack} onClick={onBack}>Voltar</button>}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  screen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 16, padding: 24,
    minHeight: '100%', background: '#12131e', color: '#e8e9f0',
  },
  title: { fontSize: 22, fontWeight: 800, margin: 0 },
  sub:   { fontSize: 13, color: '#8b8fa8', margin: 0 },
  fallbackBox: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '12px 20px', width: '100%', maxWidth: 320,
  },
  fallbackLine: { fontSize: 13, color: '#c8cad8', margin: '4px 0' },
  btn: {
    padding: '10px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700,
    background: '#6c8ef5', color: '#fff', border: 'none', cursor: 'pointer',
  },
  btnBack: {
    padding: '8px 20px', borderRadius: 99, fontSize: 13,
    background: 'rgba(255,255,255,0.06)', color: '#8b8fa8',
    border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
  },
};
