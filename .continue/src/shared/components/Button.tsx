import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    transition: 'background var(--transition), color var(--transition), box-shadow var(--transition)',
    cursor: 'pointer',
    border: 'none',
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  style,
  ...props
}) => {
  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? { background: 'var(--color-primary)', color: 'var(--color-bg)', padding: 'var(--space-3) var(--space-6)' }
      : variant === 'secondary'
      ? { background: 'var(--color-surface-offset)', color: 'var(--color-text)', padding: 'var(--space-3) var(--space-6)', border: '1px solid var(--color-border)' }
      : { background: 'transparent', color: 'var(--color-text-muted)', padding: 'var(--space-3) var(--space-6)' };

  const sizeStyle: React.CSSProperties =
    size === 'sm'
      ? { fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-4)' }
      : size === 'lg'
      ? { fontSize: 'var(--text-lg)', padding: 'var(--space-4) var(--space-8)', borderRadius: 'var(--radius-lg)' }
      : { fontSize: 'var(--text-base)' };

  return (
    <button style={{ ...styles.base, ...variantStyle, ...sizeStyle, ...style }} {...props}>
      {children}
    </button>
  );
};
