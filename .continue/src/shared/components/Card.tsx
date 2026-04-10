import React from 'react';

interface CardProps {
  children: React.ReactNode;
  accent?: string;
  interactive?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, accent, interactive, style, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        transition: interactive ? 'box-shadow var(--transition), transform var(--transition)' : undefined,
        cursor: interactive ? 'pointer' : undefined,
        outline: accent ? `2px solid ${accent}22` : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!interactive) return;
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (!interactive) return;
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {children}
    </div>
  );
};
