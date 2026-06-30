import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { AttentionType } from '../../hooks/useProgressData';

interface ReguaLudicaProps {
  score: number;
  level: string;
  attentionType?: AttentionType;
  title?: string;
  subtitle?: string;
}

const ATTENTION_COLORS: Record<string, string> = {
  'seletiva': 'var(--color-selective)',
  'sustentada': 'var(--color-sustained)',
  'alternada': 'var(--color-alternating)',
  'dividida': 'var(--color-divided)',
  'onboarding': 'var(--color-primary)'
};

export const ReguaLudica: React.FC<ReguaLudicaProps> = ({ 
  score, 
  level, 
  attentionType = 'seletiva', 
  title = "Sua Pontuação",
  subtitle = "Desempenho nesta sessão" 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to actual score on mount
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const color = ATTENTION_COLORS[attentionType] || 'var(--color-primary)';
  

  return (
    <Card 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-6)',
        alignItems: 'center',
        padding: 'var(--space-8)',
        background: `linear-gradient(145deg, color-mix(in srgb, ${color} 10%, var(--color-surface)), var(--color-surface))`
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: 'var(--text-lg)', 
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ 
            margin: 'var(--space-2) 0 0 0', 
            fontSize: 'var(--text-sm)', 
            color: 'var(--color-text-faint)' 
          }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="var(--color-surface-offset)" 
            strokeWidth="8"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - animatedScore / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ 
            fontSize: 'var(--text-4xl)', 
            fontWeight: 'bold', 
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            lineHeight: 1
          }}>
            {Math.round(animatedScore)}
          </div>
          <div style={{ 
            fontSize: 'var(--text-xs)', 
            color: 'var(--color-text-muted)',
            marginTop: 'var(--space-1)'
          }}>
            / 100
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: 'var(--space-4)',
        padding: 'var(--space-2) var(--space-6)',
        borderRadius: 'var(--radius-full)',
        background: `color-mix(in srgb, ${color} 20%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`
      }}>
        <span style={{ 
          fontSize: 'var(--text-md)', 
          fontWeight: 600, 
          color: color,
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          {level}
        </span>
      </div>
    </Card>
  );
};
