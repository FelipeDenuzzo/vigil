// src/attentions/alternated/games/ColorShape/ColorShapeReportPanel.tsx
// Painel de laudo pós-sessão do ColorShape — espelha EvaluationReportPanel do VisualSearch.

import type { EvaluationReport } from '../../../../lib/evaluatorClient';

const s = {
  panel: {
    display: 'grid',
    gap: 12,
  } as const,
  section: {
    background: '#161820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    color: '#e8e9f0',
  } as const,
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#e8e9f0',
  } as const,
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  } as const,
  emoji: { fontSize: 36 } as const,
  scoreLabel: { fontSize: 18, fontWeight: 800, color: '#e8e9f0' } as const,
  scoreLevel: { fontSize: 13, color: '#8b8fa8', marginTop: 2 } as const,
  text: { fontSize: 14, lineHeight: 1.6, color: '#c8cad8', margin: 0 } as const,
  list: { paddingLeft: 18, margin: 0 } as const,
  listItem: { fontSize: 14, lineHeight: 1.6, color: '#c8cad8', marginBottom: 4 } as const,
  chip: {
    display: 'inline-block',
    background: 'rgba(108,142,245,0.15)',
    border: '1px solid rgba(108,142,245,0.3)',
    borderRadius: 8,
    padding: '2px 10px',
    fontSize: 12,
    color: '#7ab4f8',
    marginRight: 6,
    marginBottom: 4,
  } as const,
};

const LEVEL_EMOJI: Record<string, string> = {
  'mínimo':    '🌟',
  'minimo':    '🌟',
  'leve':      '👍',
  'moderado':  '📊',
  'importante':'🔔',
};

const LEVEL_LABEL: Record<string, string> = {
  'mínimo':    'Excelente — alternância fluida',
  'minimo':    'Excelente — alternância fluida',
  'leve':      'Bom desempenho',
  'moderado':  'Desempenho regular',
  'importante':'Precisa de atenção',
};

export function ColorShapeReportPanel({ report }: { report: EvaluationReport }) {
  const level = report.level ?? '';
  const emoji = LEVEL_EMOJI[level] ?? '🧩';
  const label = LEVEL_LABEL[level] ?? 'Resultado processado';

  return (
    <div style={s.panel}>

      {/* ─ Lúdico ─ */}
      {report.ludic && (
        <section style={s.section}>
          <div style={s.scoreRow}>
            <span style={s.emoji}>{emoji}</span>
            <div>
              <p style={s.scoreLabel}>{label}</p>
              <p style={s.scoreLevel}>Nível: {level}</p>
            </div>
          </div>
          {report.ludic.summary && (
            <p style={s.text}>{report.ludic.summary}</p>
          )}
        </section>
      )}

      {/* ─ Geral ─ */}
      {report.general && (
        <section style={s.section}>
          <h3 style={s.title}>📋 Resumo geral</h3>
          {report.general.summary && <p style={s.text}>{report.general.summary}</p>}

          {Array.isArray(report.general.strengths) && report.general.strengths.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...s.text, fontWeight: 700, marginBottom: 6 }}>✅ Pontos fortes</p>
              <ul style={s.list}>
                {report.general.strengths.map((item, i) => (
                  <li key={i} style={s.listItem}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(report.general.weaknesses) && report.general.weaknesses.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...s.text, fontWeight: 700, marginBottom: 6 }}>⚠️ Pontos de atenção</p>
              <ul style={s.list}>
                {report.general.weaknesses.map((item, i) => (
                  <li key={i} style={s.listItem}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {report.general.recommendation && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...s.text, fontWeight: 700, marginBottom: 4 }}>💡 Recomendação</p>
              <p style={s.text}>{report.general.recommendation}</p>
            </div>
          )}
        </section>
      )}

      {/* ─ Clínico ─ */}
      {report.clinical && (
        <section style={s.section}>
          <h3 style={s.title}>🧠 Perspectiva clínica</h3>
          {report.clinical.clinicalNote && (
            <p style={s.text}>{report.clinical.clinicalNote}</p>
          )}

          {Array.isArray(report.clinical.strengths) && report.clinical.strengths.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...s.text, fontWeight: 700, marginBottom: 6 }}>Habilidades preservadas</p>
              <ul style={s.list}>
                {report.clinical.strengths.map((item, i) => (
                  <li key={i} style={s.listItem}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(report.clinical.weaknesses) && report.clinical.weaknesses.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...s.text, fontWeight: 700, marginBottom: 6 }}>Áreas de dificuldade</p>
              <ul style={s.list}>
                {report.clinical.weaknesses.map((item, i) => (
                  <li key={i} style={s.listItem}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {report.clinical.recommendation && (
            <div style={{ marginTop: 10 }}>
              <p style={{ ...s.text, fontWeight: 700, marginBottom: 4 }}>Encaminhamento</p>
              <p style={s.text}>{report.clinical.recommendation}</p>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
