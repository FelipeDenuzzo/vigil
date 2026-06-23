// src/attentions/divided/games/MentalVault/RecallPhase.tsx
import React, { useState } from 'react';
import { Button } from '../../../../shared/components/Button';

interface Props {
  targetLetters: string[];
  onComplete: (userAnswers: string[]) => void;
}

const KEYBOARD_CONSONANTS = [
  'B', 'C', 'D', 'F', 'G',
  'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S',
  'T', 'V', 'W', 'X', 'Y', 'Z'
];

export const RecallPhase: React.FC<Props> = ({
  targetLetters,
  onComplete,
}) => {
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

  const handleKeyClick = (letter: string) => {
    if (selectedLetters.length >= targetLetters.length) return;
    setSelectedLetters((prev) => [...prev, letter]);
  };


  const handleBackspace = () => {
    setSelectedLetters((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (selectedLetters.length < targetLetters.length) return;
    onComplete(selectedLetters);
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '350px',
      gap: 'var(--space-4)',
    },
    instruction: {
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      color: '#ffffff',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      textAlign: 'center' as const,
      marginBottom: 'var(--space-2)',
    },
    slotRow: {
      display: 'flex',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)',
    },
    slot: {
      width: '50px',
      height: '50px',
      borderRadius: 'var(--radius-md)',
      border: '2px solid var(--color-divided)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'var(--text-lg)',
      fontWeight: 700,
      color: 'var(--color-text)',
      backgroundColor: 'var(--color-surface)',
    },
    keyboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: 'var(--space-2)',
      maxWidth: '350px',
      width: '100%',
    },
    keyButton: {
      padding: 'var(--space-2) 0',
      fontSize: '16px',
      fontWeight: 700,
      color: 'var(--color-text)',
      backgroundColor: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      textAlign: 'center' as const,
      userSelect: 'none' as const,
      transition: 'all 0.15s',
    },
    controlRow: {
      display: 'flex',
      gap: 'var(--space-3)',
      marginTop: 'var(--space-4)',
      width: '100%',
      maxWidth: '350px',
    },
  };

  const isFull = selectedLetters.length === targetLetters.length;

  return (
    <div style={styles.container}>
      <h2 style={styles.instruction}>Digite as letras na ordem</h2>

      {/* Caixa de exibição das letras digitadas */}
      <div style={styles.slotRow}>
        {targetLetters.map((_, index) => (
          <div key={index} style={styles.slot}>
            {selectedLetters[index] ?? ''}
          </div>
        ))}
      </div>

      {/* Teclado Virtual */}
      <div style={styles.keyboardGrid}>
        {KEYBOARD_CONSONANTS.map((char) => (
          <button
            key={char}
            style={{
              ...styles.keyButton,
              opacity: selectedLetters.length >= targetLetters.length ? 0.6 : 1,
            }}
            onClick={() => handleKeyClick(char)}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Controles de Ação */}
      <div style={styles.controlRow}>
        <Button variant="secondary" onClick={handleBackspace} style={{ flex: 1 }}>
          Apagar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!isFull}
          style={{
            flex: 1.5,
            backgroundColor: isFull ? 'var(--color-divided)' : 'var(--color-surface-offset)',
          }}
        >
          Confirmar
        </Button>
      </div>
    </div>
  );
};
