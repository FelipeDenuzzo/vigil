// src/attentions/sustained/games/FruitWatch/FruitWatchEvaluationContainer.tsx

import { useEffect, useRef, useState } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db, { auth } from '../../../../lib/firebase';
import { useFruitWatchEvaluation } from './useFruitWatchEvaluation';
import type { FruitWatchEvaluationResult } from './useFruitWatchEvaluation';
import type { PhaseRawResult, FruitWatchScore } from './types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { FruitWatchEvaluationLoadingAnimation } from './FruitWatchEvaluationLoadingAnimation';
import { FruitWatchReportPanel } from './FruitWatchReportPanel';
import { calculateFruitWatchScore } from './logic';

type LoadedState = false | 'organizing' | true;

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

async function saveReportToFirestore(sessionId: string, uid: string, report: EvaluationReport): Promise<void> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    await setDoc(ref, { uid, geminiReport: report, sessionId, savedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('[FruitWatch] Falha ao salvar no Firestore:', err);
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
    console.warn('[FruitWatch] Falha ao carregar do Firestore:', err);
    return null;
  }
}

function generateLocalFallbackReport(metrics: FruitWatchScore): EvaluationReport {
  const level =
    metrics.focoContinuo >= 80 ? 'mínimo' :
    metrics.focoContinuo >= 60 ? 'leve' :
    metrics.focoContinuo >= 40 ? 'moderado' : 'importante';

  const labelMap = {
    'mínimo': 'Excelente desempenho',
    'leve': 'Bom desempenho',
    'moderado': 'Desempenho regular',
    'importante': 'Precisa de atenção',
  };

  const emojiMap = {
    'mínimo': '🌟',
    'leve': '👍',
    'moderado': '📊',
    'importante': '🔔',
  };

  return {
    score: metrics.focoContinuo,
    level,
    ludic: {
      score: metrics.focoContinuo,
      label: labelMap[level],
      emoji: emojiMap[level],
    },
    general: {
      summary: `Treino de atenção sustentada concluído. Seus scores foram: Foco Contínuo de ${metrics.focoContinuo}%, Controle e Calma de ${metrics.controleCalma}%, e Foco Multitarefa de ${metrics.focoMultitarefa}%.`,
      strengths: [
        metrics.focoContinuo >= 75 ? 'Excelente consistência em manter a atenção focada em estímulos de baixa semelhança visual.' : 'Boa capacidade geral de engajamento na tarefa.',
        metrics.controleCalma >= 75 ? 'Excelente controle de impulsividade frente a objetos muito parecidos visualmente.' : 'Resiliência atencional preservada.',
      ],
      weaknesses: [
        metrics.focoContinuo < 75 ? 'Houve oscilações pontuais de foco (omissões) nas rodadas iniciais do treino.' : 'Leves oscilações naturais de atenção.',
        metrics.controleCalma < 75 ? 'Dificuldade para frear o impulso de contar figuras semelhantes (falsos positivos).' : 'Leves deslizes sob pressão visual.',
      ],
      recommendation: 'Mantenha treinos contínuos para consolidar a estabilidade da sua atenção sustentada e melhorar a precisão em ambientes de alta distração.',
    },
    clinical: {
      strengths: [
        `Foco Contínuo de ${metrics.focoContinuo}% demonstrando estabilidade perceptual básica.`,
        `Controle e Calma de ${metrics.controleCalma}% refletindo bom controle motor e inibitório.`
      ],
      weaknesses: [
        `Falsos positivos e comissões motoras reduzindo a eficiência em fases de alta semelhança.`,
      ],
      recommendation: 'Recomenda-se realizar exercícios de atenção alternada e sustentada com alta densidade de distratores.',
      clinicalNote: `Análise técnica: O treino apresentou omissões baixas nas rodadas de baixa exigência, sugerindo boa resiliência atencional geral. Nas fases de alta semelhança, os erros de comissão e falsos positivos revelam a curva de fadiga de atenção sustentada. O custo de dupla tarefa (DTC) de ${Math.round(100 - metrics.focoMultitarefa)}% aponta para a carga operacional da memória de trabalho.`,
    }
  };
}

interface Props {
  results: PhaseRawResult[];
  sessionId: string;
  onRepeat?: () => void;
  onBack?: () => void;
}

export function FruitWatchEvaluationContainer({ results, sessionId, onRepeat, onBack }: Props) {
  const [result, setResult] = useState<FruitWatchEvaluationResult | null>(null);
  const [geminiReport, setGeminiReport] = useState<EvaluationReport | null>(null);
  const [loaded, setLoaded] = useState<LoadedState>(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const uid = auth.currentUser?.uid;
      setLoaded(false);

      // 1️⃣ Verifica cache no Firestore
      const cached = await loadReportFromFirestore(sessionId);
      if (cached) {
        const metrics = calculateFruitWatchScore(results);
        setResult({ metrics, geminiReport: cached });
        setGeminiReport(cached);
        setLoaded(true);
        return;
      }

      // 2️⃣ Chama avaliador interno + Gemini
      let res: FruitWatchEvaluationResult | null = null;
      try {
        res = await useFruitWatchEvaluation(results, sessionId);
      } catch (err) {
        console.warn('[FruitWatch] Erro na avaliação externa:', err);
      }

      // Se falhar ou vier nulo, aplica o fallback local
      if (!res || !res.geminiReport) {
        const metrics = calculateFruitWatchScore(results);
        const fallbackReport = generateLocalFallbackReport(metrics);
        res = { metrics, geminiReport: fallbackReport };
      }

      setResult(res);
      setLoaded('organizing');

      if (res.geminiReport && uid) {
        await saveReportToFirestore(sessionId, uid, res.geminiReport);
        setGeminiReport(res.geminiReport);
      }

      setLoaded(true);
    })();
  }, [results, sessionId]);

  // Loading
  if (loaded === false || loaded === 'organizing') {
    return (
      <div style={s.screen}>
        <FruitWatchEvaluationLoadingAnimation
          phase={loaded === false ? 'analyzing' : 'organizing'}
        />
      </div>
    );
  }

  // Laudo completo / fallback carregado
  return (
    <div style={s.screen}>
      <p style={s.title}>🥷 Foco Ninja Concluído</p>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {geminiReport && result && (
          <FruitWatchReportPanel
            report={geminiReport}
            metrics={result.metrics}
          />
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {onRepeat && <button style={s.btn} onClick={onRepeat}>↺ Repetir treino</button>}
        {onBack && <button style={s.btnBack} onClick={onBack}>Voltar</button>}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    minHeight: '100%',
    background: '#12131e',
    color: '#e8e9f0',
  },
  title: { fontSize: 22, fontWeight: 800, margin: 0, color: '#6c8ef5' },
  btn: {
    padding: '12px 28px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    background: '#6c8ef5',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(108,142,245,0.25)',
  },
  btnBack: {
    padding: '12px 28px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
  },
};
