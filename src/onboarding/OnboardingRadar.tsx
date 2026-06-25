import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ORDER = [
  'Agilidade Mental',
  'Foco Contínuo',
  'Controle e Calma',
  'Flexibilidade Mental',
  'Foco Multitarefa'
] as const;

const COLORS: Record<string, string> = {
  'Agilidade Mental': '#6dbf87',
  'Foco Contínuo': '#6c8ef5',
  'Controle e Calma': '#f56c6c',
  'Flexibilidade Mental': '#f5c070',
  'Foco Multitarefa': '#c084fc',
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
  onComplete: () => void;
}

export const OnboardingRadar: React.FC<OnboardingRadarProps> = ({ scores, onComplete }) => {
  const [step, setStep] = useState(1);

  const cx = 140, cy = 140, maxR = 100, size = 280;
  const n = ORDER.length;

  const currentValues = ORDER.map((t) => (scores && scores[t]) ?? 0);
  const referenceValues = ORDER.map(() => 75); // Polígono externo de referência
  const referenceInner = ORDER.map(() => 55); // Polígono interno de referência (faixa cinza)
  
  // Grade de 25 em 25
  const gridLevels = [25, 50, 75, 100];

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const getStepText = () => {
    switch(step) {
      case 1: return "Essa é a sua teia de atenção. Vamos conhecê-la juntos.";
      case 2: return "Cada eixo representa uma habilidade cognitiva que você vai treinar.";
      case 3: return "Quanto mais longe do centro, maior o desempenho naquela habilidade.";
      case 4: return "A faixa cinza representa a zona de equilíbrio (média esperada).\n⚠️ Isso é uma leitura livre — não um diagnóstico clínico.";
      case 5: return "Este é o seu ponto de partida, medido agora mesmo pelas suas respostas!";
      default: return "";
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          
          {/* STEP 1: Ponto Central Pulsando */}
          <motion.circle
            cx={cx} cy={cy} r={4}
            fill="var(--color-primary)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: step === 1 ? [1, 1.5, 1] : 1, opacity: step >= 1 ? 1 : 0 }}
            transition={step === 1 ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }}
          />

          {/* STEP 3: Grid (Fade in) */}
          <AnimatePresence>
            {step >= 3 && gridLevels.map((lvl, i) => (
              <motion.circle
                key={`grid-${lvl}`}
                cx={cx} cy={cy} r={(lvl / 100) * maxR}
                fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3,3"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            ))}
          </AnimatePresence>

          {/* STEP 4: Zona de Referência (Faixa Cinza / Translúcida) */}
          {/* Desenhamos a diferença entre 75 e 55 como um anel contínuo se fossem círculos, mas como é radar com N eixos, é um polígono vazado */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.path
                d={`M ${buildPolygon(referenceValues, cx, cy, maxR)} Z M ${buildPolygon(referenceInner, cx, cy, maxR)} Z`}
                fillRule="evenodd"
                fill="rgba(139,143,168,0.15)"
                stroke="rgba(139,143,168,0.5)"
                strokeWidth={1}
                strokeDasharray="4,3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
                style={{ transformOrigin: 'center' }}
              />
            )}
          </AnimatePresence>

          {/* STEP 2: Eixos */}
          <AnimatePresence>
            {step >= 2 && ORDER.map((_, i) => {
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
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              );
            })}
          </AnimatePresence>

          {/* STEP 5: Baseline Real do Usuário */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.polygon
                points={buildPolygon(currentValues, cx, cy, maxR)}
                fill="rgba(108,142,245,0.3)"
                stroke="#6c8ef5"
                strokeWidth={2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
                style={{ transformOrigin: 'center' }}
              />
            )}
          </AnimatePresence>

          {/* STEP 2: Labels */}
          <AnimatePresence>
            {step >= 2 && ORDER.map((type, i) => {
              const angle = (2 * Math.PI * i) / n - Math.PI / 2;
              const p = polarToCartesian(cx, cy, maxR + 30, angle);
              
              // Ajuste especial para labels de N eixos
              let anchor: "middle" | "end" | "start" = 'middle';
              if (p.x < cx - 10) anchor = 'end';
              if (p.x > cx + 10) anchor = 'start';
              
              // Multiline handling for long labels
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
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                >
                  <tspan x={p.x} dy="0">{line1}</tspan>
                  {line2 && <tspan x={p.x} dy="14">{line2}</tspan>}
                </motion.text>
              );
            })}
          </AnimatePresence>

        </svg>
      </div>

      <motion.div 
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', minHeight: 60, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: '0 var(--space-4)', whiteSpace: 'pre-line' }}
      >
        {getStepText()}
      </motion.div>

      <button
        onClick={handleNext}
        style={{
          background: step === 5 ? 'var(--color-primary)' : 'var(--color-surface-2)',
          color: step === 5 ? '#fff' : 'var(--color-text)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-3) var(--space-6)',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          fontWeight: 600,
          transition: 'all 0.2s'
        }}
      >
        {step === 5 ? "Ver Análise Completa" : "Próximo"}
      </button>

    </div>
  );
};
