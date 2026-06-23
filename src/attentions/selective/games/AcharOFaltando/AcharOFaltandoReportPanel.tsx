// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoReportPanel.tsx
import { useState } from 'react';
import type { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from '../../../../assessment/acharOFaltando/types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { ReportDisclaimer } from '../../../../shared/components/ReportDisclaimer';

interface Props {
  metrics: AcharOFaltandoMetrics | null;
  scaleResult: AcharOFaltandoScaleResult | null;
  geminiReport: EvaluationReport | undefined;
  reportUrl: string | null;
  loaded: boolean;
  onRepeat: () => void;
  onBack: () => void;
}

type Tab = 'ludic' | 'analysis';

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#10B981', // Emerald
  'leve':      '#F59E0B', // Amber
  'moderado':  '#F97316', // Orange
  'importante':'#EF4444', // Red
};

const LEVEL_EMOJI: Record<string, string> = {
  'mínimo':    '🎯',
  'leve':      '⭐',
  'moderado':  '⚡',
  'importante':'🧩',
};

const LEVEL_LABEL: Record<string, string> = {
  'mínimo':    'Desempenho Excelente',
  'leve':      'Desempenho Bom',
  'moderado':  'Desempenho Moderado',
  'importante':'Atenção Importante',
};

const s = {
  wrapper: {
    background: '#161820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
  },
  header: {
    padding: '20px 20px 0 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e8e9f0',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  buttonGroup: {
    display: 'flex',
    gap: 8,
  },
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
  } as const,
  tab: (active: boolean): React.CSSProperties => ({
    padding: '12px 4px',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    color: active ? '#6c8ef5' : '#8b8fa8',
    border: 'none',
    borderBottom: active ? '2px solid #6c8ef5' : '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    transition: 'color 0.18s, border-bottom 0.18s',
  }),
  body: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  ludicContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: '8px 0',
  },
  ludicScore: {
    fontSize: 48,
    fontWeight: 800,
    color: '#e8e9f0',
    margin: 0,
    lineHeight: 1.1,
  },
  ludicLabel: {
    fontSize: 18,
    fontWeight: 600,
    color: '#a0b4f8',
    marginTop: 8,
    marginBottom: 4,
  },
  gaugeWrap: {
    width: '100%',
    maxWidth: 500,
    position: 'relative' as const,
    marginTop: 12,
    marginBottom: 4,
  },
  gaugeTrack: {
    height: 10,
    borderRadius: 99,
    background: 'linear-gradient(to right, #EF4444, #F97316, #F59E0B, #10B981)',
    position: 'relative' as const,
  },
  gaugeMarker: (pct: number): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    left: `${pct}%`,
    transform: 'translate(-50%, -50%)',
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    border: '3px solid #6c8ef5',
    boxShadow: '0 0 0 3px rgba(108,142,245,0.3)',
    transition: 'left 0.4s ease-out',
  }),
  gaugeLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 6,
    fontSize: 10,
    color: '#8b8fa8',
  } as const,
  levelBadge: (level: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    color: LEVEL_COLOR[level] ?? '#e8e9f0',
    border: `1px solid ${LEVEL_COLOR[level] ?? '#e8e9f0'}`,
    background: `${LEVEL_COLOR[level]}15`,
    marginLeft: 8,
    textTransform: 'capitalize' as const,
  }),
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  statCard: {
    padding: '16px',
    borderRadius: 'var(--radius-md, 8px)',
    background: 'var(--color-surface-2, rgba(255,255,255,0.03))',
    border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e8e9f0',
    margin: 0,
  },
  statLabel: {
    fontSize: 11,
    color: '#8b8fa8',
    marginTop: 4,
    margin: 0,
  },
  curveSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e8e9f0',
    marginBottom: 10,
  },
  curveGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  curveRow: (isPerfect: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: 6,
    background: isPerfect ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
    border: isPerfect ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(255,255,255,0.06)',
    fontSize: 13,
  }),
  analysisBlock: {
    fontSize: 14,
    color: '#c8cad8',
    lineHeight: 1.7,
    padding: '14px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'pre-wrap' as const,
  },
  recommendationBlock: {
    fontSize: 13,
    color: '#b0b4c8',
    lineHeight: 1.6,
    padding: '14px',
    background: 'rgba(108,142,245,0.04)',
    border: '1px solid rgba(108,142,245,0.15)',
    borderRadius: 10,
    marginTop: 4,
  },
  bulletList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    marginTop: 8,
  },
  listItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    fontSize: 13,
    color: '#c8cad8',
    lineHeight: 1.5,
  },
  dot: (color: string): React.CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 6,
  }),
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '4px 0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: 16,
    textAlign: 'center' as const,
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '3px solid rgba(108,142,245,0.1)',
    borderTop: '3px solid #6c8ef5',
  },
  downloadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    background: '#22c55e',
    color: '#fff',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.2s',
    alignSelf: 'flex-start',
  },
  downloadButtonDisabled: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.04)',
    color: '#8b8fa8',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
    cursor: 'not-allowed',
    border: '1px solid rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
  }
};

export default function AcharOFaltandoReportPanel({
  metrics,
  scaleResult,
  geminiReport,
  reportUrl,
  loaded,
  onRepeat,
  onBack,
}: Props) {
  const [tab, setTab] = useState<Tab>('ludic');

  if (!metrics) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Nenhum resultado disponível.</p>
        <button onClick={onBack} style={{ marginTop: 16, cursor: 'pointer' }}>Voltar</button>
      </div>
    );
  }

  const score = geminiReport?.ludic?.score ?? scaleResult?.score ?? 0;
  const level = geminiReport?.level ?? scaleResult?.level ?? 'leve';
  const emoji = geminiReport?.ludic?.emoji ?? LEVEL_EMOJI[level] ?? '⭐';
  const label = geminiReport?.ludic?.label ?? LEVEL_LABEL[level] ?? 'Bom!';

  const allStrengths = [
    ...(geminiReport?.general?.strengths ?? []),
    ...(geminiReport?.clinical?.strengths ?? []).filter(
      (c) => !(geminiReport?.general?.strengths ?? []).some((g) => g.trim() === c.trim())
    ),
  ];

  const allWeaknesses = [
    ...(geminiReport?.general?.weaknesses ?? []),
    ...(geminiReport?.clinical?.weaknesses ?? []).filter(
      (c) => !(geminiReport?.general?.weaknesses ?? []).some((g) => g.trim() === c.trim())
    ),
  ];

  return (
    <div style={s.wrapper}>
      <style>{`
        @keyframes reportPanelSpin {
          to { transform: rotate(360deg); }
        }
        .report-panel-spinner {
          animation: reportPanelSpin 1s linear infinite;
        }
        .download-btn-hover:hover {
          background-color: #16a34a !important;
        }
      `}</style>

      {/* Disclaimer fixo de conformidade CFP */}
      <ReportDisclaimer />

      <div style={s.header}>
        <div style={s.headerTop}>
          <h1 style={s.title}>
            🔎 Achar o Faltando — Laudo Técnico
            <span style={s.levelBadge(level)}>{level}</span>
          </h1>
          <div style={s.buttonGroup}>
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                color: '#8b8fa8', cursor: 'pointer', fontSize: 13,
              }}
            >
              ← Voltar
            </button>
            <button
              onClick={onRepeat}
              style={{
                padding: '8px 16px', background: '#6c8ef5',
                border: 'none', borderRadius: 8,
                color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              Repetir treino
            </button>
          </div>
        </div>

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
            <div style={s.ludicContainer}>
              <p style={s.ludicScore}>{emoji} {score}</p>
              <p style={s.ludicLabel}>{label}</p>
              <div style={s.gaugeWrap}>
                <div style={s.gaugeTrack}>
                  <div style={s.gaugeMarker(score)} />
                </div>
                <div style={s.gaugeLegend}>
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>
            </div>

            {/* Grid de métricas locais rápidas */}
            <div style={s.metricsGrid}>
              {[
                { label: 'Rodadas jogadas', value: metrics.roundsPlayed },
                { label: 'Acertos', value: metrics.totalHits },
                { label: 'Omissões', value: metrics.totalOmissions },
                { label: 'Falsos positivos', value: metrics.totalFalsePositives },
                { label: 'Acertos/minuto', value: metrics.accuracyPerMinute.toFixed(2) },
                { label: 'Tempo médio/rodada', value: `${(metrics.averageResponseMs / 1000).toFixed(1)} s` },
              ].map(({ label, value }) => (
                <div key={label} style={s.statCard}>
                  <p style={s.statValue}>{value}</p>
                  <p style={s.statLabel}>{label}</p>
                </div>
              ))}
            </div>

            {/* Histórico/Curva por Rodada */}
            <div style={s.curveSection}>
              <h2 style={s.sectionTitle}>Curva por Rodada</h2>
              {metrics.roundCurve.length === 0 ? (
                <p style={{ color: '#8b8fa8', fontSize: 13 }}>Nenhuma rodada concluída.</p>
              ) : (
                <div style={s.curveGrid}>
                  {metrics.roundCurve.map(entry => {
                    const isPerfect = entry.hits > 0 && entry.omissions === 0 && entry.falsePositives === 0;
                    return (
                      <div key={entry.roundNumber} style={s.curveRow(isPerfect)}>
                        <span style={{ fontWeight: 600, color: '#e8e9f0' }}>Rodada {entry.roundNumber}</span>
                        <span>Acertos: <strong style={{ color: '#6dbf87' }}>{entry.hits}</strong></span>
                        <span>Omissões: <strong style={{ color: entry.omissions > 0 ? '#f5c070' : '#8b8fa8' }}>{entry.omissions}</strong></span>
                        <span>Falsos: <strong style={{ color: entry.falsePositives > 0 ? '#f08080' : '#8b8fa8' }}>{entry.falsePositives}</strong></span>
                        <span style={{ color: '#8b8fa8' }}>{(entry.responseTimeMs / 1000).toFixed(1)} s</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'analysis' && (
          <>
            {!loaded ? (
              <div style={s.loadingContainer}>
                <div className="report-panel-spinner" style={s.spinner} />
                <p style={{ color: '#8b8fa8', fontSize: 13 }}>
                  Gerando relatório clínico completo com Inteligência Artificial...
                </p>
              </div>
            ) : !geminiReport ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <p style={{ color: '#8b8fa8', fontSize: 13 }}>
                  Não foi possível obter a análise detalhada da IA no momento. Por favor, verifique sua conexão ou tente novamente.
                </p>
              </div>
            ) : (
              <>
                {/* Narrativa Clínica */}
                <div style={s.analysisBlock}>
                  {geminiReport.clinical.clinicalNote || geminiReport.general.summary}
                </div>

                {/* Forças e Pontos de Atenção */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <h3 style={s.sectionTitle}>✅ O que foi bem</h3>
                    {allStrengths.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#8b8fa8' }}>Nenhum ponto mapeado.</p>
                    ) : (
                      <div style={s.bulletList}>
                        {allStrengths.map((item, i) => (
                          <div key={i} style={s.listItem}>
                            <span style={s.dot('#10b981')} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={s.sectionTitle}>⚠️ Pontos de atenção</h3>
                    {allWeaknesses.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#8b8fa8' }}>Nenhum ponto mapeado.</p>
                    ) : (
                      <div style={s.bulletList}>
                        {allWeaknesses.map((item, i) => (
                          <div key={i} style={s.listItem}>
                            <span style={s.dot('#f59e0b')} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={s.divider} />

                {/* Recomendações */}
                <div style={s.recommendationBlock}>
                  <p style={{ ...s.sectionTitle, marginBottom: 6 }}>💡 Recomendações Terapêuticas</p>
                  <p style={{ fontSize: 13, color: '#e8e9f0', margin: 0, lineHeight: 1.6 }}>
                    {geminiReport.clinical.recommendation || geminiReport.general.recommendation}
                  </p>
                </div>

                {/* Botão de Download */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  {reportUrl ? (
                    <a
                      href={reportUrl}
                      download={`laudo-achar-o-faltando-${metrics.roundsPlayed}.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-btn-hover"
                      style={s.downloadButton}
                    >
                      📥 Baixar laudo (.md)
                    </a>
                  ) : (
                    <button
                      disabled
                      title="O arquivo markdown está sendo gravado no servidor..."
                      style={s.downloadButtonDisabled}
                    >
                      ⏳ Gravando laudo para download...
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
