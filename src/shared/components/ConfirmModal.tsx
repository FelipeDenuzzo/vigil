import React from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Tem certeza que quer avançar?',
  message = 'Você leu o que estava escrito?',
  confirmText = 'Sim, eu li',
  cancelText = 'Vou ler de novo',
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--text-lg)' }}>
          {title}
        </h3>
        
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm} style={{ flex: 1 }}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
