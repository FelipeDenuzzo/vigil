// src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx

import { useState } from 'react';
import { useAuth } from '../../../../lib/AuthContext';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { ReportDisclaimer } from '../../../../shared/components/ReportDisclaimer';

type Tab = 'ludic' | 'analysis';

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#6dbf87',
  'leve':      '#f5c070',
  'moderado':  '#f5a060',
  'importante':'#f08080',
};

const s = {
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

  gaugeWrap: {
    position: 'relative' as const,
    marginTop: 8,
    marginBottom: 4,
  },

  gaugeTrack: {
    height: 12,
    borderRadius: 99,
    background: 'linear-gradient(to right, #f08080, #f5c070, #6dbf87)',
    position: 'relative' as const,
  },

  gaugeMarker: (pct: number): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    left: `${pct}%`,
    transform: 'translate(-50%, -50%)',
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    border: '3px solid #6c8ef5',
    boxShadow: '0 0 0 3px rgba(108,142,245,0.3)',
  }),

  gaugeLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 6,
    fontSize: 11,
    color: '#ffffff',
  } as const,

  ludicScore: {
    textAlign: 'center' as const,
    fontSize: 48,
    fontWeight: 800,
    color: '#e8e9f0',
    lineHeight: 1,
    marginTop: 16,
  },

  ludicLabel: {
    textAlign: 'center' as const,
    fontSize: 18,
    fontWeight: 600,
    color: '#a0b4f8',
    marginTop: 6,
    marginBottom: 4,
  },

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
};

export function EvaluationReportPanel({ report }: { report: EvaluationReport }) {
  const { displayName } = useAuth();
  const [tab, setTab] = useState<Tab>('ludic');

  const allStrengths = [
    ...report.general.strengths,
    ...report.clinical.strengths.filter(
      (c) => !report.general.strengths.some((g) => g.trim() === c.trim())
    ),
  ];

  const allWeaknesses = [
    ...report.general.weaknesses,
    ...report.clinical.weaknesses.filter(
      (c) => !report.general.weaknesses.some((g) => g.trim() === c.trim())
    ),
  ];

  return (
    <div className="result-card" style={s.wrapper}>

      {/* ── Disclaimer fixo — sempre visível, independente da aba ── */}
      <ReportDisclaimer />

      <div style={s.header}>
        <p style={s.title}>
          🤖 Avaliação de {displayName ? displayName.split(' ')[0] : 'Sessão'}
          <span style={s.levelBadge(report.level)}>{report.level}</span>
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
            <p style={s.ludicScore}>{report.ludic.emoji} {report.ludic.score}</p>
            <p style={s.ludicLabel}>{report.ludic.label}</p>
            <div style={s.gaugeWrap}>
              <div style={s.gaugeTrack}>
                <div style={s.gaugeMarker(report.ludic.score)} />
              </div>
              <div style={s.gaugeLegend}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </>
        )}

        {tab === 'analysis' && (
          <>
            <div style={s.analysisBlock}>
              {report.clinical.clinicalNote || report.general.summary}
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
              {report.clinical.recommendation || report.general.recommendation}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
