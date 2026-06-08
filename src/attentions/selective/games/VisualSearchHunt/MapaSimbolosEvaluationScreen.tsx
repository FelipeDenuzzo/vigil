// src/attentions/selective/games/VisualSearchHunt/MapaSimbolosEvaluationScreen.tsx

import type { MapaSimbolosEvaluationReport } from './useMapaSimbolosEvaluation';
import { EvaluationLoadingAnimation } from './EvaluationLoadingAnimation';

type Props = {
  report: MapaSimbolosEvaluationReport | null;
  loaded: boolean;
  onRepeatTraining: () => void;
  onBackToStart: () => void;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  container: { padding: 16, display: 'grid', gap: 20 } as const,
  section: {
    background: '#161820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    color: '#e8e9f0',
  } as const,
  title: { marginBottom: 12, color: '#e8e9f0', fontSize: 16, fontWeight: 700 } as const,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 } as const,
  metricCard: {
    background: '#1c1f2a',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  metricLabel: { fontSize: 11, color: '#8b8fa8', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  metricValue: { fontSize: 22, fontWeight: 700, color: '#e8e9f0' },
  metricSub: { fontSize: 12, color: '#8b8fa8' },
  trendBadge: (trend: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    background:
      trend === 'improved' ? 'rgba(100,220,140,0.15)'
      : trend === 'declined' ? 'rgba(240,128,128,0.15)'
      : 'rgba(255,255,255,0.08)',
    color:
      trend === 'improved' ? '#64dc8c'
      : trend === 'declined' ? '#f08080'
      : '#c4c6d8',
  }),
  trendLabel: (trend: string) =>
    trend === 'improved' ? '↑ Melhorou'
    : trend === 'declined' ? '↓ Caiu'
    : trend === 'first_session' ? '⭐ Primeira sessão'
    : '→ Estável',
  strategyBadge: (strategy: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    background: strategy === 'organized' ? 'rgba(108,142,245,0.15)' : 'rgba(255,180,100,0.15)',
    color: strategy === 'organized' ? '#6c8ef5' : '#ffb464',
  }),
  errorBox: { textAlign: 'center' as const, padding: '32px 16px', color: '#f08080', fontSize: 14 },
  actions: { display: 'grid', gap: 12, marginTop: 8 } as const,
  primaryButton: {
    minHeight: 48, border: 'none', borderRadius: 12, padding: '12px 16px',
    background: '#6c8ef5', color: '#ffffff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  } as const,
  secondaryButton: {
    minHeight: 48, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
    padding: '12px 16px', background: '#1c1f2a', color: '#e8e9f0',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
  } as const,
  disabledButton: {
    minHeight: 48, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
    padding: '12px 16px', background: '#1c1f2a', color: '#4a4d62',
    fontSize: 16, fontWeight: 700, cursor: 'not-allowed', opacity: 0.7,
  } as const,
  helperText: { marginTop: 6, fontSize: 13, color: '#8b8fa8' } as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined, decimals = 0): string {
  if (val == null) return '—';
  return val.toFixed(decimals);
}

function msToSec(ms: number | null | undefined): string {
  if (ms == null) return '—';
  return (ms / 1000).toFixed(2) + 's';
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricsSection({ report }: { report: MapaSimbolosEvaluationReport }) {
  const m = report.metrics;

  return (
    <section style={s.section}>
      <h3 style={s.title}>Resultados da sessão</h3>

      {/* Trend */}
      <div style={{ marginBottom: 16 }}>
        <span style={s.trendBadge(report.trend)}>{s.trendLabel(report.trend)}</span>
        {report.deltaScorePct != null && (
          <span style={{ marginLeft: 8, fontSize: 13, color: '#8b8fa8' }}>
            {report.deltaScorePct > 0 ? '+' : ''}{report.deltaScorePct.toFixed(1)}% vs. média histórica
          </span>
        )}
      </div>

      {/* Grid de métricas */}
      <div style={s.grid}>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Acertos</span>
          <span style={s.metricValue}>{m.hits}</span>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Erros (comissão)</span>
          <span style={s.metricValue}>{m.commissionErrors}</span>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Omissões</span>
          <span style={s.metricValue}>{m.omissions}</span>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Tempo médio</span>
          <span style={s.metricValue}>{msToSec(m.avgRtMs)}</span>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>IES</span>
          <span style={s.metricValue}>{m.ies != null ? fmt(m.ies, 0) : '—'}</span>
          <span style={s.metricSub}>ms/acerto</span>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>CON</span>
          <span style={s.metricValue}>{fmt(m.con, 0)}</span>
          <span style={s.metricSub}>acertos − erros</span>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Organização</span>
          <span style={s.metricValue}>{fmt(m.organizationScore, 0)}%</span>
        </div>
        {m.dualTaskCost != null && (
          <div style={s.metricCard}>
            <span style={s.metricLabel}>Custo dual-task</span>
            <span style={s.metricValue}>{fmt(m.dualTaskCost, 1)}</span>
            <span style={s.metricSub}>CON reduzido</span>
          </div>
        )}
      </div>

      {/* Estratégia de busca */}
      <div style={{ marginTop: 16 }}>
        <span style={{ fontSize: 13, color: '#8b8fa8', marginRight: 8 }}>Estratégia de busca:</span>
        <span style={s.strategyBadge(m.searchStrategy)}>
          {m.searchStrategy === 'organized' ? '🔵 Organizada' : '🟠 Caótica'}
        </span>
      </div>
    </section>
  );
}

function ErrorBlock() {
  return (
    <section style={s.section}>
      <div style={s.errorBox}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>⚠️</p>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Não foi possível gerar a avaliação.</p>
        <p style={{ fontSize: 12, color: '#a0a4be' }}>
          O serviço não respondeu a tempo. Tente repetir o treino para gerar um novo relatório.
        </p>
      </div>
    </section>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export function MapaSimbolosEvaluationScreen({
  report,
  loaded,
  onRepeatTraining,
  onBackToStart,
}: Props) {
  return (
    <div style={s.container}>

      {/* Bloco de avaliação */}
      {!loaded ? (
        <EvaluationLoadingAnimation organizing={false} />
      ) : report ? (
        <MetricsSection report={report} />
      ) : (
        <ErrorBlock />
      )}

      {/* Próximos passos */}
      <section style={s.section}>
        <h3 style={s.title}>Próximos passos</h3>
        <div style={s.actions}>
          <button type="button" onClick={onRepeatTraining} style={s.primaryButton}>
            Repetir o treino
          </button>
          <button type="button" onClick={onBackToStart} style={s.secondaryButton}>
            Voltar ao começo
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Continuidade da trilha ainda não disponível"
            style={s.disabledButton}
          >
            Seguir a trilha
          </button>
        </div>
        <p style={s.helperText}>
          O botão "Seguir a trilha" ficará disponível quando a continuidade da trilha for implementada.
        </p>
      </section>

    </div>
  );
}
