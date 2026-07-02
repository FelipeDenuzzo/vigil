import React, { useState } from 'react';
import { ReguaLudica } from '../../../../shared/components/ReguaLudica';
import { ReportDisclaimer } from '../../../../shared/components/ReportDisclaimer';

interface EvaluationReportPanelProps {
  report: any;
  isEvaluating: boolean;
  error: Error | null;
  onClose: () => void;
  onRepeat: () => void;
}

type Tab = 'ludic' | 'analysis';

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#6dbf87',
  'leve':      '#f5c070',
  'moderado':  '#f5a060',
  'importante':'#f08080',
};

const s = {
  container: {
    padding: 16,
    display: "grid",
    gap: 20,
    maxWidth: 640,
    margin: '0 auto',
    width: '100%'
  } as const,
  wrapper: {
    background: 'rgb(22, 24, 32)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  } as const,
  header: {
    padding: '16px 16px 0',
  } as const,
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e8e9f0',
    marginBottom: 12,
  } as const,
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  } as const,
  tab: (active: boolean): React.CSSProperties => ({
    padding: '10px 4px',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    color: active ? '#6c8ef5' : '#ffffff',
    borderBottom: active ? '2px solid #6c8ef5' : '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    transition: 'color 0.18s',
  }),
  body: {
    padding: 16,
    display: 'grid',
    gap: 12,
  } as const,
  analysisBlock: {
    fontSize: 14,
    color: '#c8cad8',
    lineHeight: 1.7,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  } as const,
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    marginBottom: 8,
    marginTop: 2,
  } as const,
  listItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    fontSize: 13,
    color: '#c8cad8',
    lineHeight: 1.55,
    marginBottom: 7,
  } as const,
  dot: (color: string): React.CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 5,
  }),
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '2px 0',
  } as const,
  levelBadge: (level: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    color: LEVEL_COLOR[level] ?? '#e8e9f0',
    border: `1px solid ${LEVEL_COLOR[level] ?? '#e8e9f0'}`,
    marginLeft: 8,
  }),
  actions: {
    display: "grid",
    gap: 12,
    marginTop: 8,
  } as const,
  primaryButton: {
    minHeight: 48,
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#6c8ef5",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  } as const,
  secondaryButton: {
    minHeight: 48,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#1c1f2a",
    color: "#e8e9f0",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  } as const,
  metricCard: {
    background: '#252538',
    padding: '1rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  }
};

function MetricCard({ label, value, severity }: { label: string, value: string | number, severity?: string }) {
  let color = '#fff';
  if (severity === 'high') color = '#ef4444';
  if (severity === 'medium') color = '#f59e0b';
  if (severity === 'low') color = '#10b981';

  return (
    <div style={s.metricCard}>
      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color }}>{value}</span>
    </div>
  );
}

export const EvaluationReportPanel: React.FC<EvaluationReportPanelProps> = ({
  report,
  isEvaluating,
  error,
  onClose,
  onRepeat
}) => {
  const [tab, setTab] = useState<Tab>('ludic');

  if (isEvaluating) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>Analisando desempenho cognitivo...</div>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#f87171' }}>
        <h2>Erro na Avaliação</h2>
        <p>{error.message}</p>
        <button onClick={onClose} style={{ marginTop: '1rem', padding: '8px 16px', background: 'white', color: 'black', border: 'none', borderRadius: '4px' }}>Voltar</button>
      </div>
    );
  }

  if (!report) return null;

  const { metrics, scaleResult, geminiReport } = report;
  const level = scaleResult?.level || geminiReport?.level || 'mínimo';

  const allStrengths = [
    ...(geminiReport?.general?.strengths || []),
    ...(geminiReport?.clinical?.strengths || []).filter(
      (c: string) => !(geminiReport?.general?.strengths || []).some((g: string) => g.trim() === c.trim())
    ),
  ];

  const allWeaknesses = [
    ...(geminiReport?.general?.weaknesses || []),
    ...(geminiReport?.clinical?.weaknesses || []).filter(
      (c: string) => !(geminiReport?.general?.weaknesses || []).some((g: string) => g.trim() === c.trim())
    ),
  ];

  return (
    <div style={s.container}>
      <div className="result-card" style={s.wrapper}>
        <ReportDisclaimer />

        <div style={s.header}>
          <p style={s.title}>
            🤖 Avaliação
            <span style={s.levelBadge(level)}>{level}</span>
          </p>
          <div style={s.tabRow}>
            {(['ludic', 'analysis'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                style={s.tab(tab === t)}
                onClick={() => setTab(t)}
              >
                {t === 'ludic' ? '🎯 Régua' : '📋 Análise'}
              </button>
            ))}
          </div>
        </div>

        <div style={s.body}>
          {tab === 'ludic' && (
            <>
              <ReguaLudica score={scaleResult.score} level={level} />
            </>
          )}

          {tab === 'analysis' && (
            <>
              <div style={s.analysisBlock}>
                {geminiReport?.clinical?.clinicalNote || geminiReport?.general?.summary || "Avaliação concluída."}
              </div>

              {allStrengths.length > 0 && (
                <>
                  <p style={s.sectionTitle}>✅ O que foi bem</p>
                  {allStrengths.map((item, i) => (
                    <div key={i} style={s.listItem}>
                      <span style={s.dot('#6dbf87')} />{item}
                    </div>
                  ))}
                </>
              )}

              {allWeaknesses.length > 0 && (
                <>
                  <p style={s.sectionTitle}>⚠️ Pontos de atenção</p>
                  {allWeaknesses.map((item, i) => (
                    <div key={i} style={s.listItem}>
                      <span style={s.dot('#f5c070')} />{item}
                    </div>
                  ))}
                </>
              )}

              <div style={s.divider} />

              <p style={{ fontSize: 12, color: '#ffffff', lineHeight: 1.6, padding: '8px 2px', textAlign: 'center' }}>
                {geminiReport?.clinical?.recommendation || geminiReport?.general?.recommendation || "Continue praticando."}
              </p>

              <div style={{ marginTop: 16 }}>
                <p style={s.sectionTitle}>Métricas Locais</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  <MetricCard label="Omissões" value={metrics.omissions} severity={scaleResult.omissionSeverity} />
                  <MetricCard label="Falsos Alarmes" value={metrics.commissions} severity={scaleResult.commissionSeverity} />
                  <MetricCard label="Tempo Médio" value={`${Math.round(metrics.meanRT)} ms`} />
                  <MetricCard label="Queda Vig." value={`${(metrics.vigilanceDecrement * 100).toFixed(1)}%`} severity={scaleResult.vigilanceDecrementSeverity} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={s.actions}>
        <button type="button" onClick={onRepeat} style={s.primaryButton}>
          Repetir o treino
        </button>
        <button type="button" onClick={onClose} style={s.secondaryButton}>
          Sair
        </button>
      </div>
    </div>
  );
};
