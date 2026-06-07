// src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx
// Painel com os 3 níveis de avaliação: Lúdico · Geral · Clínico

import { useState } from 'react';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';

type Tab = 'ludic' | 'general' | 'clinical';

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#6dbf87',
  'leve':      '#f5c070',
  'moderado':  '#f5a060',
  'importante':'#f08080',
};

const s = {
  wrapper: {
    background: '#161820',
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

  // ── Tabs ──
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  } as const,

  tab: (active: boolean): React.CSSProperties => ({
    padding: '10px 4px',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    color: active ? '#6c8ef5' : '#8b8fa8',
    borderBottom: active ? '2px solid #6c8ef5' : '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #6c8ef5' : '2px solid transparent',
    transition: 'color 0.18s',
  }),

  body: {
    padding: 16,
    display: 'grid',
    gap: 12,
  } as const,

  // ── Régua lúdica ──
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
    color: '#8b8fa8',
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

  // ── Geral / Clínico ──
  summary: {
    fontSize: 14,
    color: '#c8cad8',
    lineHeight: 1.6,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  } as const,

  listTitle: {
    fontSize: 12,
    color: '#8b8fa8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 6,
    marginTop: 4,
  },

  listItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    fontSize: 13,
    color: '#c8cad8',
    lineHeight: 1.5,
    marginBottom: 6,
  } as const,

  dot: (color: string): React.CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 5,
  }),

  recommendBox: {
    background: 'rgba(108,142,245,0.08)',
    border: '1px solid rgba(108,142,245,0.2)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    color: '#a0b4f8',
    lineHeight: 1.6,
  } as const,

  clinicalNote: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 12,
    color: '#a0a4be',
    lineHeight: 1.7,
    fontStyle: 'italic' as const,
  },

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
  const [tab, setTab] = useState<Tab>('ludic');

  return (
    <div style={s.wrapper}>
      {/* cabeçalho */}
      <div style={s.header}>
        <p style={s.title}>
          🤖 Avaliação IA
          <span style={s.levelBadge(report.level)}>{report.level}</span>
        </p>

        {/* abas */}
        <div style={s.tabRow}>
          {(['ludic', 'general', 'clinical'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              style={s.tab(tab === t)}
              onClick={() => setTab(t)}
            >
              {t === 'ludic'    ? '🎯 Régua' :
               t === 'general'  ? '📋 Geral' :
                                  '🔬 Clínico'}
            </button>
          ))}
        </div>
      </div>

      {/* conteúdo */}
      <div style={s.body}>

        {/* ── LÚDICO ── */}
        {tab === 'ludic' && (
          <>
            <p style={s.ludicScore}>
              {report.ludic.emoji} {report.ludic.score}
            </p>
            <p style={s.ludicLabel}>{report.ludic.label}</p>

            <div style={s.gaugeWrap}>
              <div style={s.gaugeTrack}>
                <div style={s.gaugeMarker(report.ludic.score)} />
              </div>
              <div style={s.gaugeLegend}>
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </>
        )}

        {/* ── GERAL ── */}
        {tab === 'general' && (
          <>
            <p style={s.summary}>{report.general.summary}</p>

            <p style={s.listTitle}>Pontos fortes</p>
            {report.general.strengths.map((item, i) => (
              <div key={i} style={s.listItem}>
                <span style={s.dot('#6dbf87')} />
                {item}
              </div>
            ))}

            <p style={s.listTitle}>Pontos de atenção</p>
            {report.general.weaknesses.map((item, i) => (
              <div key={i} style={s.listItem}>
                <span style={s.dot('#f5c070')} />
                {item}
              </div>
            ))}

            <div style={s.recommendBox}>
              💡 {report.general.recommendation}
            </div>
          </>
        )}

        {/* ── CLÍNICO ── */}
        {tab === 'clinical' && (
          <>
            <p style={s.listTitle}>Pontos preservados</p>
            {report.clinical.strengths.map((item, i) => (
              <div key={i} style={s.listItem}>
                <span style={s.dot('#6dbf87')} />
                {item}
              </div>
            ))}

            <p style={s.listTitle}>Achados</p>
            {report.clinical.weaknesses.map((item, i) => (
              <div key={i} style={s.listItem}>
                <span style={s.dot('#f08080')} />
                {item}
              </div>
            ))}

            <div style={s.recommendBox}>
              📋 {report.clinical.recommendation}
            </div>

            <div style={s.clinicalNote}>
              {report.clinical.clinicalNote}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
