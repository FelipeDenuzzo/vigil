import React from 'react';
import type { AttentionProgress } from '../../hooks/useProgressData';

const LABELS: Record<string, string> = {
  seletiva: 'Seletiva', sustentada: 'Sustentada', alternada: 'Alternada', dividida: 'Dividida',
};
const COLORS = {
  seletiva: '#6c8ef5', sustentada: '#6dbf87', alternada: '#f5c070', dividida: '#c084fc',
};
const ORDER = ['seletiva', 'sustentada', 'alternada', 'dividida'] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function buildPolygon(values: number[], cx: number, cy: number, maxR: number): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const r = (v / 100) * maxR;
      const p = polarToCartesian(cx, cy, r, angle);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

interface Props {
  byType: Record<string, AttentionProgress>;
}

export const AttentionRadar: React.FC<Props> = ({ byType }) => {
  const cx = 140, cy = 140, maxR = 100, size = 280;
  const n = ORDER.length;

  const baselineValues = ORDER.map((t) => byType[t]?.baseline?.score ?? 0);
  const currentValues = ORDER.map((t) => {
    const sessions = byType[t]?.sessions ?? [];
    const last5 = [...sessions].reverse().slice(0, 5);
    return last5.length > 0 ? Math.round(last5.reduce((a, b) => a + b.score, 0) / last5.length) : 0;
  });

  const hasAnyData = currentValues.some((v) => v > 0);

  // Grid circles
  const gridLevels = [25, 50, 75, 100];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* Grid circles */}
        {gridLevels.map((lvl) => (
          <circle key={lvl} cx={cx} cy={cy} r={(lvl / 100) * maxR}
            fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3,3" />
        ))}

        {/* Axes */}
        {ORDER.map((_, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const p = polarToCartesian(cx, cy, maxR, angle);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-border)" strokeWidth={1} />;
        })}

        {/* Baseline polygon */}
        <polygon
          points={buildPolygon(baselineValues, cx, cy, maxR)}
          fill="rgba(139,143,168,0.15)"
          stroke="rgba(139,143,168,0.5)"
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />

        {/* Current polygon */}
        {hasAnyData && (
          <polygon
            points={buildPolygon(currentValues, cx, cy, maxR)}
            fill="rgba(108,142,245,0.2)"
            stroke="#6c8ef5"
            strokeWidth={2}
          />
        )}

        {/* Axis labels */}
        {ORDER.map((type, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const p = polarToCartesian(cx, cy, maxR + 22, angle);
          return (
            <text key={type} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fill={COLORS[type]} fontSize={11} fontWeight={600}>
              {LABELS[type]}
            </text>
          );
        })}
      </svg>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: 'var(--text-xs)', color: '#ffffff' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width={16} height={4}><line x1={0} y1={2} x2={16} y2={2} stroke="rgba(139,143,168,0.6)" strokeWidth={1.5} strokeDasharray="4,3" /></svg>
          Baseline
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width={16} height={4}><line x1={0} y1={2} x2={16} y2={2} stroke="#6c8ef5" strokeWidth={2} /></svg>
          Média atual
        </span>
      </div>
    </div>
  );
};
