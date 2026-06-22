// src/attentions/divided/games/MentalVault/EncodingPhase.tsx
import React, { useEffect, useState } from 'react';

interface Props {
  letters: string[];
  displayDurationMs: number;
  onComplete: () => void;
}

export const EncodingPhase: React.FC<Props> = ({
  letters,
  displayDurationMs,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLetter, setShowLetter] = useState(true);

  useEffect(() => {
    if (currentIndex >= letters.length) {
      onComplete();
      return;
    }

    // Tempo de exibição da letra
    const displayTimer = setTimeout(() => {
      // Oculta brevemente antes de passar para a próxima para marcar a transição
      setShowLetter(false);

      const transitionTimer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setShowLetter(true);
      }, 200); // 200ms de intervalo em branco

      return () => clearTimeout(transitionTimer);
    }, displayDurationMs);

    return () => clearTimeout(displayTimer);
  }, [currentIndex, letters.length, displayDurationMs, onComplete]);

  // Se já terminamos a sequência, mostramos tela vazia até o gatilho da transição
  const isFinished = currentIndex >= letters.length;
  const currentLetter = isFinished ? '' : letters[currentIndex];

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '350px',
      gap: 'var(--space-6)',
    },
    instruction: {
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      color: 'var(--color-text-muted)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      textAlign: 'center' as const,
    },
    vaultCircle: {
      width: '160px',
      height: '160px',
      borderRadius: '50%',
      backgroundColor: 'var(--color-surface-2)',
      border: '4px solid var(--color-divided)',
      boxShadow: '0 0 20px var(--color-primary-glow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
    },
    letterText: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 800,
      color: 'var(--color-text)',
      transition: 'opacity 0.15s ease-in-out',
      opacity: showLetter && !isFinished ? 1 : 0,
      fontFamily: 'monospace',
    },
    progressRow: {
      display: 'flex',
      gap: 'var(--space-3)',
      marginTop: 'var(--space-4)',
    },
    progressDot: (active: boolean) => ({
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: active ? 'var(--color-divided)' : 'var(--color-text-faint)',
      transition: 'background-color 0.2s',
    }),
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.instruction}>Guarde estas letras</h2>

      <div style={styles.vaultCircle}>
        <span style={styles.letterText}>{currentLetter}</span>
      </div>

      <div style={styles.progressRow}>
        {letters.map((_, index) => (
          <div
            key={index}
            style={styles.progressDot(index <= currentIndex && !isFinished)}
          />
        ))}
      </div>
    </div>
  );
};
