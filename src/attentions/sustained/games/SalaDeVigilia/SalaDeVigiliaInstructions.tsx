import React from 'react';

interface SalaDeVigiliaInstructionsProps {
  onNext: () => void;
  onClose: () => void;
}

export const SalaDeVigiliaInstructions: React.FC<SalaDeVigiliaInstructionsProps> = ({ onNext, onClose }) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <button 
        onClick={onClose}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          marginBottom: '2rem',
          padding: 0,
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        ← Voltar
      </button>

      <h1 style={{ fontSize: '2rem', color: 'var(--color-sustained, #2563eb)', marginBottom: '1rem' }}>
        Sala de Vigília
      </h1>
      
      <div style={{ maxWidth: '600px', textAlign: 'center', fontSize: '1.25rem', lineHeight: '1.6' }}>
        <p style={{ color: 'white', marginBottom: '1rem' }}>
          Este treino mede sua capacidade de manter a atenção focada em um ambiente monótono por um período prolongado.
        </p>
        
        <p style={{ color: 'white', marginBottom: '2rem' }}>
          <strong>Instrução:</strong> Observe as lâmpadas na tela. Quando uma delas acender, toque nela rapidamente.
        </p>
        
        <button 
          onClick={onNext}
          style={{
            padding: '12px 24px',
            fontSize: '1.1rem',
            backgroundColor: 'var(--color-sustained, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Ir para Simulação
        </button>
      </div>
    </div>
  );
};
