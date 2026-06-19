import { useState } from 'react';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import type { MazeAggregatedMetrics } from '../../../../assessment/longMazes/types';

type Tab = 'ludic' | 'analysis' | 'phases';

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#6dbf87',
  'leve':      '#f5c070',
  'moderado':  '#f5a060',
  'importante':'#f08080',
};

const DISCLAIMER =
  '⚠️ Este resultado é baseado em uma tarefa de treino e não substitui avaliação profissional. Em caso de dúvidas, consulte um profissional de saúde mental.';

export function LongMazesReportPanel({
  report,
  metrics,
}: {
  report: EvaluationReport;
  metrics: MazeAggregatedMetrics;
}) {
  const [tab, setTab] = useState<Tab>('ludic');

  const score = report.ludic?.score ?? report.score;
  const emoji = report.ludic?.emoji ?? '🧩';
  const label = report.ludic?.label ?? '';
  const strengths  = [...(report.general?.strengths  ?? []), ...(report.clinical?.strengths  ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  const weaknesses = [...(report.general?.weaknesses ?? []), ...(report.clinical?.weaknesses ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  const clinicalNote = report.clinical?.clinicalNote ?? '';
  const recommendation = report.general?.recommendation ?? '';

  const PHASE_LABELS = ['Fácil', 'Médio', 'Difícil'];

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <p style={s.title}>
          🧠 Avaliação IA
          <span style={s.levelBadge(report.level)}>{report.level}</span>
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
            <p style={s.ludicScore}>{emoji} {score}</p>
            {label && <p style={s.ludicLabel}>{label}</p>}
            <div style={s.gaugeWrap}>
              <div style={s.gaugeTrack}>
                <div style={s.gaugeMarker(score)} />
              </div>
              <div style={s.gaugeLegend}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
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
                  <div key={i} style={s.listItem}>
                    <span style={s.dot('#6dbf87')} />{item}
                  </div>
                ))}
              </>
            )}

            {weaknesses.length > 0 && (
              <>
                <p style={s.sectionTitle}>⚠️ Pontos de atenção</p>
                {weaknesses.map((item, i) => (
                  <div key={i} style={s.listItem}>
                    <span style={s.dot('#f5c070')} />{item}
                  </div>
                ))}
              </>
            )}

            <div style={s.divider} />
            <p style={s.disclaimerBox}>{DISCLAIMER}</p>
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
                  <Stat label="Eficiência" value={`${p.efficiencyPct}%`} />
                  <Stat label="Revisitas" value={String(p.revisits)} />
                  <Stat label="Entradas em becos" value={String(p.deadEndEntries)} />
                  <Stat label="Lapsos de atenção" value={String(p.longStops)} />
                  <Stat label="Pausa pós-erro" value={`${p.postErrorPauseMs}ms`} />
                  <Stat label="Tempo" value={`${Math.round(p.elapsedMs / 1000)}s`} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#8b8fa8', fontSize: 12 }}>{label}</span>
      <span style={{ color: '#e8e9f0', fontWeight: 700, fontSize: 12 }}>{value}</span>
    </div>
  );
}

const s: Record<string, any> = {
  wrapper: {
    background: '#161820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, overflow: 'hidden',
  },
  header: { padding: '16px 16px 0' },
  title: { fontSize: 16, fontWeight: 700, color: '#e8e9f0', marginBottom: 12 },
  tabRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '10px 4px', textAlign: 'center', fontSize: 12,
    fontWeight: active ? 700 : 400,
    color: active ? '#6c8ef5' : '#8b8fa8',
    borderBottom: active ? '2px solid #6c8ef5' : '2px solid transparent',
    cursor: 'pointer', background: 'none', transition: 'color 0.18s',
  }),
  body: { padding: 16, display: 'grid', gap: 12 },
  gaugeWrap: { position: 'relative', marginTop: 8, marginBottom: 4 },
  gaugeTrack: {
    height: 12, borderRadius: 99,
    background: 'linear-gradient(to right, #f08080, #f5c070, #6dbf87)',
    position: 'relative',
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
    marginTop: 6, fontSize: 11, color: '#8b8fa8',
  },
  ludicScore: {
    textAlign: 'center', fontSize: 48, fontWeight: 800,
    color: '#e8e9f0', lineHeight: 1, marginTop: 16,
  },
  ludicLabel: {
    textAlign: 'center', fontSize: 18, fontWeight: 600,
    color: '#a0b4f8', marginTop: 6, marginBottom: 4,
  },
  recommendation: {
    fontSize: 13, color: '#c8cad8', lineHeight: 1.6,
    padding: '10px 14px', background: 'rgba(108,142,245,0.08)',
    borderRadius: 10, textAlign: 'center',
  },
  analysisBlock: {
    fontSize: 14, color: '#c8cad8', lineHeight: 1.7,
    padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#8b8fa8',
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
  divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' },
  levelBadge: (level: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 99,
    fontSize: 12, fontWeight: 700,
    color: LEVEL_COLOR[level] ?? '#e8e9f0',
    border: `1px solid ${LEVEL_COLOR[level] ?? '#e8e9f0'}`,
    marginLeft: 8,
  }),
  disclaimerBox: {
    fontSize: 12, color: '#8b8fa8', lineHeight: 1.6,
    padding: '8px 2px', textAlign: 'center',
  },
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
