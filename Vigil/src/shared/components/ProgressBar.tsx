import React from 'react';

interface ProgressBarProps {
  value: number;       // 0–100
  color?: string;      // var CSS
  height?: number;     // px
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'var(--color-primary)',
  height = 6,
}) => (
  <div
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
    style={{
      width: '100%',
      height,
      background: 'var(--color-surface-offset)',
      borderRadius: 'var(--radius-full)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: '100%',
        background: color,
        borderRadius: 'var(--radius-full)',
        transition: 'width 400ms ease',
      }}
    />
  </div>
);