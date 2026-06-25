import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ORDER = [
  'Seletiva',
  'Sustentada',
  'Alternada',
  'Dividida'
] as const;

const COLORS: Record<string, string> = {
  'Seletiva': '#f56c6c',
  'Sustentada': '#6c8ef5',
  'Alternada': '#f5c070',
  'Dividida': '#c084fc',
};

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

interface OnboardingRadarProps {
  scores: Record<string, number>;
}

export const OnboardingRadar: React.FC<OnboardingRadarProps> = ({ scores }) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasInvalidScores = !scores || Object.values(scores).some(v => v === undefined || v === null || isNaN(v));
      if (hasInvalidScores) {
        setShowFallback(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [scores]);

  const cx = 140, cy = 140, maxR = 100, size = 280;
  const n = ORDER.length;

  const currentValues = ORDER.map((t) => (scores && scores[t]) ?? 0);
  const referenceValues = ORDER.map(() => 75); // Polígono externo de referência
  const referenceInner = ORDER.map(() => 55); // Polígono interno de referência (faixa cinza)
  
  // Grade de 25 em 25
  const gridLevels = [25, 50, 75, 100];

  if (showFallback) {
    return (
      <div style={{
        color: 'var(--color-error, #f08080)',
        textAlign: 'center',
        padding: '24px',
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        borderRadius: '12px',
        maxWidth: '300px',
        margin: '20px auto',
        fontSize: 'var(--text-sm)'
      }}>
        Não foi possível carregar o gráfico. Tente recarregar a página.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          
          {/* Ponto Central */}
          <motion.circle
            cx={cx} cy={cy} r={4}
            fill="var(--color-primary)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />

          {/* Grid (Fade in) */}
          {gridLevels.map((lvl, i) => (
            <motion.circle
              key={`grid-${lvl}`}
              cx={cx} cy={cy} r={(lvl / 100) * maxR}
              fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3,3"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          ))}

          {/* Zona de Referência (Faixa Cinza / Translúcida) */}
          <motion.path
            d={`M ${buildPolygon(referenceValues, cx, cy, maxR)} Z M ${buildPolygon(referenceInner, cx, cy, maxR)} Z`}
            fillRule="evenodd"
            fill="rgba(139,143,168,0.15)"
            stroke="rgba(139,143,168,0.5)"
            strokeWidth={1}
            strokeDasharray="4,3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.3, delay: 0.2 }}
            style={{ transformOrigin: '140px 140px' }}
          />

          {/* Eixos */}
          {ORDER.map((_, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const p = polarToCartesian(cx, cy, maxR, angle);
            return (
              <motion.line
                key={`axis-${i}`}
                x1={cx} y1={cy}
                x2={p.x} y2={p.y}
                stroke="var(--color-border)" strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
            );
          })}

          {/* Baseline Real do Usuário */}
          <motion.polygon
            points={buildPolygon(currentValues, cx, cy, maxR)}
            fill="rgba(108,142,245,0.3)"
            stroke="#6c8ef5"
            strokeWidth={2}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.4, delay: 0.4 }}
            style={{ transformOrigin: '140px 140px' }}
          />

          {/* Labels */}
          {ORDER.map((type, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const p = polarToCartesian(cx, cy, maxR + 30, angle);
            
            let anchor: "middle" | "end" | "start" = 'middle';
            if (p.x < cx - 10) anchor = 'end';
            if (p.x > cx + 10) anchor = 'start';
            
            const words = type.split(' ');
            const line1 = words[0];
            const line2 = words.slice(1).join(' ');

            return (
              <motion.text
                key={`label-${type}`}
                x={p.x} y={p.y - (line2 ? 6 : 0)} textAnchor={anchor} dominantBaseline="middle"
                fill={COLORS[type] || 'var(--color-text-muted)'} fontSize={11} fontWeight={600}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.05 }}
              >
                <tspan x={p.x} dy="0">{line1}</tspan>
                {line2 && <tspan x={p.x} dy="14">{line2}</tspan>}
              </motion.text>
            );
          })}

        </svg>
      </div>
    </div>
  );
};
