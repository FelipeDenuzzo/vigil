import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      case 2: return "Cada eixo representa um tipo de atenção que você vai treinar.";
      case 3: return "Quanto mais longe do centro, maior o desempenho naquele tipo.";
      case 4: return "A faixa cinza representa o range de referência da literatura para adultos saudáveis.\n⚠️ Isso é uma leitura livre — não é um instrumento clínico.";
      case 5: return "Este é o seu ponto de partida, medido agora mesmo.";
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
        style={{ textAlign: 'center', minHeight: 60, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: '0 var(--space-4)', whiteSpace: 'pre-line', marginBottom: step >= 5 ? 'var(--space-4)' : 0 }}
      >
        {getStepText()}
      </motion.div>

      <AnimatePresence>
        {step >= 5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}
          >
            <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${COLORS['Seletiva']}` }}>
              <h4 style={{ color: COLORS['Seletiva'], marginBottom: '4px', fontSize: '14px' }}>Seletiva</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Sua capacidade de focar no que importa e ignorar o resto. É ela que age quando você lê numa sala barulhenta ou procura um rosto numa multidão.</p>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${COLORS['Sustentada']}` }}>
              <h4 style={{ color: COLORS['Sustentada'], marginBottom: '4px', fontSize: '14px' }}>Sustentada</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Manter o foco por um período contínuo, sem deixar a mente viajar. Ela é exigida quando você assiste a uma aula longa, lê um livro ou faz uma tarefa que demora.</p>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${COLORS['Alternada']}` }}>
              <h4 style={{ color: COLORS['Alternada'], marginBottom: '4px', fontSize: '14px' }}>Alternada</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Mudar o foco de uma coisa para outra com agilidade, sem perder o fio. Ela entra em ação quando você alterna entre e-mails e uma reunião, ou muda de assunto e precisa se reorientar rapidamente.</p>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${COLORS['Dividida']}` }}>
              <h4 style={{ color: COLORS['Dividida'], marginBottom: '4px', fontSize: '14px' }}>Dividida</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Gerenciar duas ou mais coisas ao mesmo tempo. É o que você usa quando dirige e conversa, ou cozinha enquanto acompanha uma receita.</p>
            </div>
            
            <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', textAlign: 'center', marginTop: 'var(--space-2)', fontStyle: 'italic' }}>
              * Esta leitura é baseada em literatura científica sobre atenção, mas não é um instrumento clínico. Não substitui avaliação por psicólogo ou neuropsicólogo. Use como referência pessoal de treino.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
          transition: 'all 0.2s',
          width: step === 5 ? '100%' : 'auto'
        }}
      >
        {step === 5 ? "Ver Análise da Inteligência Artificial" : "Próximo"}
      </button>

    </div>
  );
};
