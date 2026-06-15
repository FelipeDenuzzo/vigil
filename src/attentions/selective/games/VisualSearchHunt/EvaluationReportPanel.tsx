// src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx

import type { EvaluationReport } from '../../../../lib/evaluatorClient';

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
    padding: '16px 16px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as const,

  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e8e9f0',
    margin: 0,
  } as const,

  levelBadge: (level: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    color: LEVEL_COLOR[level] ?? '#e8e9f0',
    border: `1px solid ${LEVEL_COLOR[level] ?? '#e8e9f0'}`,
  }),

  body: {
    padding: 16,
    display: 'grid',
    gap: 14,
  } as const,

  // Gauge
  gaugeWrap: {
    display: 'grid',
    gap: 6,
  } as const,

  gaugeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as const,

  gaugeTrack: {
    flex: 1,
    height: 10,
    borderRadius: 99,
    background: 'linear-gradient(to right, #f08080, #f5c070, #6dbf87)',
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
  }),

  gaugeScore: {
    fontSize: 28,
    fontWeight: 800,
    color: '#e8e9f0',
    lineHeight: 1,
    minWidth: 44,
    textAlign: 'right' as const,
  },

  gaugeLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#8b8fa8',
    paddingLeft: 56,
  } as const,

  ludicLabel: {
    textAlign: 'center' as const,
    fontSize: 15,
    fontWeight: 600,
    color: '#a0b4f8',
  },

  // Análise principal
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
    color: '#8b8fa8',
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

  // Rodapé
  disclaimer: {
    background: 'rgba(108,142,245,0.06)',
    border: '1px solid rgba(108,142,245,0.15)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 12,
    color: '#8b8fa8',
    lineHeight: 1.6,
  } as const,
};

export function EvaluationReportPanel({ report }: { report: EvaluationReport }) {
  // Mescla strengths e weaknesses de geral + clínico sem duplicatas
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

  // Mescla recomendações sem repetição
  const generalRec = report.general.recommendation.trim();
  const clinicalRec = report.clinical.recommendation.trim();
  const mergedRecommendation =
    generalRec.toLowerCase() === clinicalRec.toLowerCase()
      ? clinicalRec
      : `${generalRec} ${clinicalRec}`;

  return (
    <div style={s.wrapper}>
      {/* Cabeçalho */}
      <div style={s.header}>
        <p style={s.title}>🤖 Avaliação IA</p>
        <span style={s.levelBadge(report.level)}>{report.level}</span>
      </div>

      <div style={s.body}>
        {/* Gauge */}
        <div style={s.gaugeWrap}>
          <div style={s.gaugeRow}>
            <div style={s.gaugeTrack}>
              <div style={s.gaugeMarker(report.ludic.score)} />
            </div>
            <span style={s.gaugeScore}>
              {report.ludic.emoji} {report.ludic.score}
            </span>
          </div>
          <div style={s.gaugeLegend}>
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
          <p style={s.ludicLabel}>{report.ludic.label}</p>
        </div>

        <div style={s.divider} />

        {/* Análise principal — topo do conteúdo textual */}
        <div style={s.analysisBlock}>
          {report.clinical.clinicalNote || report.general.summary}
        </div>

        {/* Pontos positivos */}
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

        {/* Deficiências */}
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

        {/* Recomendação unificada + aviso legal */}
        <div style={s.disclaimer}>
          <p style={{ margin: '0 0 6px', color: '#a0b4f8', fontWeight: 600, fontSize: 13 }}>
            📌 Orientação
          </p>
          <p style={{ margin: '0 0 8px' }}>{mergedRecommendation}</p>
          <p style={{ margin: 0, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            ⚠️ Este resultado reflete o desempenho em uma tarefa de treino e <strong>não constitui diagnóstico clínico</strong>.
            Para investigação aprofundada ou dúvidas, procure um profissional de saúde mental certificado pelos conselhos.
          </p>
        </div>
      </div>
    </div>
  );
}
