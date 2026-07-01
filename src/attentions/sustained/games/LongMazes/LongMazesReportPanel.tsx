// @ts-nocheck
import { useState } from 'react';
import { useAuth } from '../../../../lib/AuthContext';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import type { MazeAggregatedMetrics } from '../../../../assessment/longMazes/types';
import { ReportDisclaimer } from '../../../../shared/components/ReportDisclaimer';
import { ReguaLudica } from '../../../../shared/components/ReguaLudica';

type Tab = 'ludic' | 'analysis' | 'phases';

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#6dbf87',
  'leve':      '#f5c070',
  'moderado':  '#f5a060',
  'importante':'#f08080',
};



interface Props {
  report: EvaluationReport;
  metrics: MazeAggregatedMetrics;
}

export function LongMazesReportPanel({
  report,
  metrics,
}: Props) {
  const { displayName } = useAuth();
  const [tab, setTab] = useState<Tab>('ludic');

  const score       = report.ludic?.score ?? report.score;
  const level       = report.level;
  const strengths   = [...(report.general?.strengths  ?? []), ...(report.clinical?.strengths  ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  const weaknesses  = [...(report.general?.weaknesses ?? []), ...(report.clinical?.weaknesses ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  const clinicalNote    = report.clinical?.clinicalNote ?? '';
  const recommendation  = report.general?.recommendation ?? '';

  const PHASE_LABELS = ['Fácil', 'Médio', 'Difícil'];

  return (
    <div className="result-card" style={s.wrapper}>
      {/* ── Disclaimer fixo — sempre visível, independente da aba ── */}
      <ReportDisclaimer />
      <div style={s.header}>
        <p style={s.title}>
          🧠 Avaliação de {displayName ? displayName.split(' ')[0] : 'Sessão'}
          {level && <span style={s.levelBadge(level)}>{level}</span>}
        </p>
        <div style={s.tabRow}>
          {(['ludic', 'analysis', 'phases'] as Tab[]).map((t) => (
            <button key={t} type="button" style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {t === 'ludic' ? '🎯 Régua' : t === 'analysis' ? '📋 Análise' : '📈 Fases'}
            </button>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {tab === 'ludic' && (
          <>
            <ReguaLudica score={score} level={level} />
            {recommendation && (
              <p style={s.recommendation}>💡 {recommendation}</p>
            )}
          </>
        )}

        {tab === 'analysis' && (
          <>
            {clinicalNote && <div style={s.analysisBlock}>{clinicalNote}</div>}
            {strengths.length > 0 && (
              <>
                <p style={s.sectionTitle}>✅ O que foi bem</p>
                {strengths.map((item, i) => (
                  <div key={i} style={s.listItem}><span style={s.dot('#6dbf87')} />{item}</div>
                ))}
              </>
            )}
            {weaknesses.length > 0 && (
              <>
                <p style={s.sectionTitle}>⚠️ Pontos de atenção</p>
                {weaknesses.map((item, i) => (
                  <div key={i} style={s.listItem}><span style={s.dot('#f5c070')} />{item}</div>
                ))}
              </>
            )}
            <div style={s.divider} />
          </>
        )}

        {tab === 'phases' && (
          <>
            <p style={s.sectionTitle}>Detalhamento por fase</p>
            {metrics.phases.map((p, i) => (
              <div key={i} style={s.phaseCard}>
                <div style={s.phaseHeader}>
                  <span style={s.phaseLabel}>{PHASE_LABELS[i] ?? `Fase ${i + 1}`}</span>
                  <span style={{ color: p.success ? '#6dbf87' : '#f08080', fontSize: 12, fontWeight: 700 }}>
                    {p.success ? '✅ Concluída' : '⏰ Tempo esgotado'}
                  </span>
                </div>
                <div style={s.phaseStats}>
                  <Stat label="Eficiência"           value={`${p.efficiencyPct}%`} />
                  <Stat label="Revisitas"             value={String(p.revisits)} />
                  <Stat label="Entradas em becos"     value={String(p.deadEndEntries)} />
                  <Stat label="Lapsos de atenção"    value={String(p.longStops)} hint="paradas > 3s sem movimento" />
                  <Stat
                    label="Pausa após batida em parede"
                    value={p.postErrorPauseMs > 0 ? `${(p.postErrorPauseMs / 1000).toFixed(1)}s` : '—'}
                    hint="tempo médio parado após bater em uma parede"
                  />
                  <Stat label="Tempo total"           value={`${Math.round(p.elapsedMs / 1000)}s`} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#ffffff', fontSize: 12 }}>{label}</span>
        <span style={{ color: '#e8e9f0', fontWeight: 700, fontSize: 12 }}>{value}</span>
      </div>
      {hint && <p style={{ fontSize: 11, color: '#5a5e75', margin: '2px 0 0', lineHeight: 1.4 }}>{hint}</p>}
    </div>
  );
}

const s = {
  wrapper: {
    background: 'rgb(22, 24, 32)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  } as const,
  header: { padding: '16px 16px 0' },
  title:  { fontSize: 16, fontWeight: 700, color: '#e8e9f0', marginBottom: 12 },
  tabRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '10px 4px', textAlign: 'center', fontSize: 12,
    fontWeight: active ? 700 : 400,
    color: active ? '#6c8ef5' : '#ffffff',
    borderBottom: active ? '2px solid #6c8ef5' : '2px solid transparent',
    cursor: 'pointer', background: 'none', transition: 'color 0.18s',
  }),
  body:      { padding: 16, display: 'grid', gap: 12 },
  gaugeWrap: { position: 'relative' as const, marginTop: 8, marginBottom: 4 },
  gaugeTrack: {
    height: 12, borderRadius: 99,
    background: 'linear-gradient(to right, #f08080, #f5c070, #6dbf87)',
    position: 'relative' as const,
  },
  gaugeMarker: (pct: number): React.CSSProperties => ({
    position: 'absolute', top: '50%', left: `${pct}%`,
    transform: 'translate(-50%, -50%)',
    width: 20, height: 20, borderRadius: '50%',
    background: '#fff', border: '3px solid #6c8ef5',
    boxShadow: '0 0 0 3px rgba(108,142,245,0.3)',
  }),
  gaugeLegend: {
    display: 'flex', justifyContent: 'space-between',
    marginTop: 6, fontSize: 11, color: '#ffffff',
  },
  ludicScore: {
    textAlign: 'center' as const, fontSize: 48, fontWeight: 800,
    color: '#e8e9f0', lineHeight: 1, marginTop: 16,
  },
  ludicLabel: {
    textAlign: 'center' as const, fontSize: 18, fontWeight: 600,
    color: '#a0b4f8', marginTop: 6, marginBottom: 4,
  },
  recommendation: {
    fontSize: 13, color: '#c8cad8', lineHeight: 1.6,
    padding: '10px 14px', background: 'rgba(108,142,245,0.08)',
    borderRadius: 10, textAlign: 'center' as const,
  },
  analysisBlock: {
    fontSize: 14, color: '#c8cad8', lineHeight: 1.7,
    padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#ffffff',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 8, marginTop: 2,
  },
  listItem: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    fontSize: 13, color: '#c8cad8', lineHeight: 1.55, marginBottom: 7,
  },
  dot: (color: string): React.CSSProperties => ({
    width: 7, height: 7, borderRadius: '50%',
    background: color, flexShrink: 0, marginTop: 5,
  }),
  divider:      { height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' },
  levelBadge: (level: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 99,
    fontSize: 12, fontWeight: 700,
    color: LEVEL_COLOR[level] ?? '#e8e9f0',
    border: `1px solid ${LEVEL_COLOR[level] ?? '#e8e9f0'}`,
    marginLeft: 8,
  }),

  phaseCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '10px 12px', marginBottom: 4,
  },
  phaseHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  phaseLabel: { fontSize: 13, fontWeight: 700, color: '#e8e9f0' },
  phaseStats: { display: 'grid', gap: 2 },
};
