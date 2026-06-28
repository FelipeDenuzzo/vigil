import React from 'react';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  onStart: () => void;
  onClose?: () => void;
}

export const SelectiveListeningInstructions: React.FC<Props> = ({ onStart, onClose }) => {
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: 'var(--space-4)' }}>
      <Card style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-4)', padding: 0 }}
          >
            ← Voltar
          </Button>
        )}
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-2)' }}>🎧</span>
        <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
          Escuta Seletiva
        </h2>
        <p style={{ color: '#ffffff', marginBottom: 'var(--space-6)', fontSize: '15px', lineHeight: '1.7', textAlign: 'center' }}>
          Este treino desafia sua capacidade de filtrar distrações sonoras concorrentes.<br />
          Você ouvirá duas vozes simultâneas (uma masculina e outra feminina) ditando números diferentes.<br />
          Preste atenção apenas à voz solicitada no início de cada rodada e digite a sequência correspondente.
        </p>
        <Button
          variant="primary"
          onClick={onStart}
          style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
        >
          Iniciar
        </Button>
      </Card>
    </div>
  );
};
