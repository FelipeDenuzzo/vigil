// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoReportPanel.tsx
import type { MissingItemSessionMetrics } from './types';

interface Props {
  metrics: MissingItemSessionMetrics | null;
  loaded: boolean;
  onRepeat: () => void;
  onBack: () => void;
}

export default function AcharOFaltandoReportPanel({ metrics, loaded, onRepeat, onBack }: Props) {
  if (!loaded) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Calculando resultados…</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Nenhum resultado disponível.</p>
        <button onClick={onBack} style={{ marginTop: 16, cursor: 'pointer' }}>Voltar</button>
      </div>
    );
  }

  const statStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    textAlign: 'center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>🔎 Achar o Faltando — Resultado</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px', background: 'transparent',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13,
            }}
          >
            ← Voltar
          </button>
          <button
            onClick={onRepeat}
            style={{
              padding: '8px 16px', background: 'var(--color-primary)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            Repetir treino
          </button>
        </div>
      </div>

      {/* Métricas principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Rodadas jogadas', value: metrics.roundsPlayed },
          { label: 'Acertos', value: metrics.totalHits },
          { label: 'Omissões', value: metrics.totalOmissions },
          { label: 'Falsos positivos', value: metrics.totalFalsePositives },
          { label: 'Acertos/minuto', value: metrics.accuracyPerMinute.toFixed(2) },
          { label: 'Tempo médio/rodada', value: `${(metrics.averageResponseMs / 1000).toFixed(1)} s` },
        ].map(({ label, value }) => (
          <div key={label} style={statStyle}>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{value}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Curva por rodada */}
      <div>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 12 }}>Curva por rodada</h2>
        {metrics.roundCurve.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Nenhuma rodada concluída.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metrics.roundCurve.map(entry => (
            <div
              key={entry.roundNumber}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: entry.hits > 0 && entry.omissions === 0
                  ? 'rgba(34,197,94,0.08)' : 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <span style={{ fontWeight: 600 }}>R{entry.roundNumber}</span>
              <span>acertos {entry.hits}</span>
              <span>omissões {entry.omissions}</span>
              <span>falsos {entry.falsePositives}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{(entry.responseTimeMs / 1000).toFixed(1)} s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
