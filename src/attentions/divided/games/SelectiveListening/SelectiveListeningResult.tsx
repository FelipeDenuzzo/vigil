import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db, { auth } from '../../../../lib/firebase';
import { useSelectiveListeningEvaluation } from './useSelectiveListeningEvaluation';
import { SelectiveListeningReportPanel } from './SelectiveListeningReportPanel';
import { EvaluationLoadingAnimation } from '../../../../shared/EvaluationLoadingAnimation';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';
import { TentativaRodada } from '../../../../assessment/selectiveListening/types';
import { calculateSelectiveListeningMetrics } from '../../../../assessment/selectiveListening/calculateSelectiveListeningMetrics';
import { buildSelectiveListeningScaleResult } from '../../../../assessment/selectiveListening/buildSelectiveListeningScaleResult';

type LoadedState = false | 'organizing' | true;

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

async function saveReportToFirestore(sessionId: string, uid: string, report: GeminiReport): Promise<void> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    await setDoc(ref, { uid, geminiReport: report, sessionId, savedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('[SelectiveListening] Falha ao salvar relatório no Firestore:', err);
  }
}

async function loadReportFromFirestore(sessionId: string): Promise<GeminiReport | null> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.geminiReport) return data.geminiReport as GeminiReport;
    }
    return null;
  } catch (err: any) {
    if (RETRYABLE_CODES.has(err?.code)) {
      try {
        await new Promise(r => setTimeout(r, 2000));
        const ref = doc(db, 'sessionReports', sessionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.geminiReport) return data.geminiReport as GeminiReport;
        }
        return null;
      } catch (retryErr) {
        console.warn('[SelectiveListening] Falha ao carregar relatório do Firestore (retry):', retryErr);
        return null;
      }
    }
    console.warn('[SelectiveListening] Falha ao carregar relatório do Firestore:', err);
    return null;
  }
}

const s = {
  container: { maxWidth: 920, margin: '0 auto', padding: 'var(--space-4)', display: 'grid', gap: '20px' } as const,
  section: {
    background: '#161820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    color: '#e8e9f0',
  } as const,
  sectionTitle: { marginBottom: 12, color: '#e8e9f0', fontSize: 16, fontWeight: 700 } as const,
  errorBox: { textAlign: 'center' as const, padding: '32px 16px', color: '#f08080', fontSize: 14 },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 } as const,
  primaryButton: {
    minHeight: 48, border: 'none', borderRadius: 12, padding: '12px 16px',
    background: 'var(--color-divided)', color: '#ffffff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s'
  } as const,
  secondaryButton: {
    minHeight: 48, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
    padding: '12px 16px', background: '#1c1f2a', color: '#e8e9f0',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s'
  } as const,
  helperText: { marginTop: 8, fontSize: 13, color: '#ffffff', textAlign: 'center' as const } as const,
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 8,
  } as const,
  metricCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  } as const,
  metricLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as const,
  metricValue: {
    fontSize: 28,
    fontWeight: 800,
    color: '#ffffff',
  } as const,
  metricSub: {
    fontSize: 12,
    color: '#a0a4be',
    lineHeight: 1.4,
  } as const,
};

export function SelectiveListeningResult() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? '';
  const navigate = useNavigate();
  const location = useLocation();

  const [geminiReport, setGeminiReport] = useState<GeminiReport | undefined>(undefined);
  const [loaded, setLoaded] = useState<LoadedState>(false);
  const [localRounds, setLocalRounds] = useState<TentativaRodada[]>([]);

  // Carrega rodadas do state de navegação caso o usuário acabe de finalizar o jogo
  const stateRounds = location.state?.rodadas as TentativaRodada[] | undefined;

  useEffect(() => {
    if (!sessionId) return;
    setLoaded(false);
    setGeminiReport(undefined);

    (async () => {
      const uid = auth.currentUser?.uid;
      // 1️⃣ Cache no Firestore
      const cached = await loadReportFromFirestore(sessionId);
      
      // Tentamos carregar as rodadas salvas na sessão do Firestore se não vierem do state
      let roundsToEvaluate = stateRounds;
      if (!roundsToEvaluate) {
        try {
          const sessionRef = doc(db, 'sessions', sessionId);
          const sessionSnap = await getDoc(sessionRef);
          if (sessionSnap.exists()) {
            const sessData = sessionSnap.data();
            if (sessData?.rodadas) {
              roundsToEvaluate = sessData.rodadas as TentativaRodada[];
            }
          }
        } catch (e) {
          console.warn('[SelectiveListening] Erro ao carregar dados da sessão:', e);
        }
      }

      if (roundsToEvaluate) {
        setLocalRounds(roundsToEvaluate);
      }

      if (cached) {
        setGeminiReport(cached);
        setLoaded(true);
        return;
      }

      // 2️⃣ Se não tem dados para avaliar, avisa
      if (!roundsToEvaluate || roundsToEvaluate.length === 0) {
        console.warn('[SelectiveListening] Sem dados de rodadas e sem cache.');
        setLoaded(true);
        return;
      }

      // 3️⃣ Chama o evaluator
      let result = null;
      try {
        result = await useSelectiveListeningEvaluation(sessionId, roundsToEvaluate);
      } catch (err) {
        console.warn('[SelectiveListening] Erro ao avaliar sessão:', err);
      }

      // 4️⃣ IA respondeu — organiza + salva
      setLoaded('organizing');

      if (result?.geminiReport && uid) {
        await saveReportToFirestore(sessionId, uid, result.geminiReport);
        setGeminiReport(result.geminiReport);
      }

      setLoaded(true);
    })();
  }, [sessionId]); // eslint-disable-line

  if (!sessionId) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Sessão não especificada.</p>
      </div>
    );
  }

  // Métricas calculadas localmente para visualização imediata
  const metrics = localRounds.length > 0 ? calculateSelectiveListeningMetrics(localRounds) : null;
  const scale = metrics ? buildSelectiveListeningScaleResult(metrics) : null;

  return (
    <div style={s.container}>
      {/* ── Painel de Métricas Locais ── */}
      {metrics && scale && (
        <section style={s.section}>
          <h3 style={s.sectionTitle}>Desempenho Geral</h3>
          <div style={s.metricsGrid}>
            <div style={s.metricCard}>
              <span style={s.metricLabel}>Precisão de Ordem</span>
              <span style={s.metricValue}>{Math.round(metrics.serialAccuracy * 100)}%</span>
              <span style={s.metricSub}>{scale.accuracyNote}</span>
            </div>
            
            <div style={s.metricCard}>
              <span style={s.metricLabel}>Precisão de Itens</span>
              <span style={s.metricValue}>{Math.round(metrics.itemAccuracy * 100)}%</span>
              <span style={s.metricSub}>Dígitos lembrados sem considerar a ordem sequencial.</span>
            </div>

            <div style={s.metricCard}>
              <span style={s.metricLabel}>Intrusão de Ruído</span>
              <span style={s.metricValue}>{Math.round(metrics.distractorIntrusionRate * 100)}%</span>
              <span style={s.metricSub}>{scale.intrusionNote}</span>
            </div>

            <div style={s.metricCard}>
              <span style={s.metricLabel}>Tempo de Resposta</span>
              <span style={s.metricValue}>{(metrics.meanResponseTimeMs / 1000).toFixed(3)} s</span>
              <span style={s.metricSub}>Latência média para começar a digitar a resposta.</span>
            </div>

            <div style={s.metricCard}>
              <span style={s.metricLabel}>Custo de Carga</span>
              <span style={s.metricValue}>{Math.round(metrics.loadCost * 100)}%</span>
              <span style={s.metricSub}>Queda de precisão ao aumentar de 3 para 4/5 números.</span>
            </div>

            <div style={s.metricCard}>
              <span style={s.metricLabel}>Repetições (Áudio)</span>
              <span style={s.metricValue}>{metrics.avgReplayCount.toFixed(1)}</span>
              <span style={s.metricSub}>Média de vezes que o áudio foi repetido por rodada.</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Painel da IA (Laudo Gemini) ── */}
      <div style={{ display: 'grid', gap: 20 }}>
        {geminiReport ? (
          <SelectiveListeningReportPanel report={geminiReport} />
        ) : loaded === false ? (
          <EvaluationLoadingAnimation organizing={false} />
        ) : loaded === 'organizing' ? (
          <EvaluationLoadingAnimation organizing={true} />
        ) : (
          <section style={s.section}>
            <div style={s.errorBox}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>⚠️</p>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Não foi possível gerar a avaliação.</p>
              <p style={{ fontSize: 12, color: '#a0a4be' }}>
                O serviço de IA não respondeu a tempo. O resultado será exibido na próxima consulta a esta sessão.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* ── Ações Finais ── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Próximos passos</h3>
        <div style={s.actions}>
          <button
            type="button"
            onClick={() => navigate('/treinar/dividida/escuta-seletiva')}
            style={s.primaryButton}
          >
            Repetir o treino
          </button>
          <button
            type="button"
            onClick={() => navigate('/treinar/dividida')}
            style={s.secondaryButton}
          >
            Voltar ao começo
          </button>
        </div>
        <p style={s.helperText}>Mais modos de treino estarão disponíveis em breve.</p>
      </section>
    </div>
  );
}

export default SelectiveListeningResult;
