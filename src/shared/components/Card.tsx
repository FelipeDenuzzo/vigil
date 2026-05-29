import React from 'react';

interface CardProps {
  children: React.ReactNode;
  accent?: string; // var CSS de cor, ex: 'var(--color-selective)'
  interactive?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, accent, interactive, style, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: accent
          ? `color-mix(in srgb, ${accent} 10%, var(--color-surface))`
          : 'var(--color-surface)',
        border: accent
          ? `1px solid color-mix(in srgb, ${accent} 45%, transparent)`
          : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        transition: interactive ? 'box-shadow var(--transition), transform var(--transition)' : undefined,
        cursor: interactive ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={e => {
        if (!interactive) return;
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        if (!interactive) return;
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {children}
    </div>
  );
};
