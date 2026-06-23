// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoSimulation.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  onDone: () => void;
  onBack: () => void;
}

type SimStep = 1 | 3 | 'done';

const SIM_GRID_A = ['18', '19', '20', '21', '22', '23', '24', '25', '26'];
const SIM_GRID_B = ['18', '19', '20', '21', '22', '27', '24', '25', '26']; // index 5 is different! ('27' instead of '23')

export default function AcharOFaltandoSimulation({ onDone, onBack }: Props) {
  const [step, setStep] = useState<SimStep>(1);
  const [hasClickedCorrect, setHasClickedCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const advance = () => {
    if (step === 1) setStep(3);
    else if (step === 3) setStep('done');
    else if (step === 'done') onDone();
  };

  const handleCellClick = (index: number) => {
    if (step !== 3) return;
    if (index === 5) {
      setHasClickedCorrect(true);
      setShowFeedback(true);
      setTimeout(() => {
        setStep('done');
      }, 1500);
    } else {
      setShowFeedback(true);
      setHasClickedCorrect(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-4)' }}>
      {/* BADGE DE MODO DE PRÁTICA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)',
        color: '#eab308', padding: '8px 20px', borderRadius: '99px',
        fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.05em',
        width: 'fit-content', margin: '0 auto 16px auto'
      }}>
        <span style={{ fontSize: '18px' }}>🚧</span> MODO DE PRÁTICA
      </div>

      <AnimatePresence mode="wait">
        
        {/* ── STEP 1: Introdução do Objetivo ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '3rem' }}>🔎</span>
              <h2 style={{ color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Como funciona o treino
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Sua tarefa é comparar dois conjuntos de símbolos e encontrar o único elemento que está diferente entre eles.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <Button
                  variant="primary"
                  onClick={advance}
                  style={{ width: '100%' }}
                >
                  Vamos ver como funciona
                </Button>
                <Button
                  variant="ghost"
                  onClick={onBack}
                  style={{ width: '100%' }}
                >
                  ← Voltar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 3: Teste Prático Interativo ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Encontre a diferença!
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Compare a Imagem A com a Imagem B. Clique na célula diferente na **Imagem B**.
                </p>
              </div>

              {/* Grades Lado a Lado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Grade A */}
                <div>
                  <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
                    Imagem A (Referência)
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', border: '1px solid var(--color-border)', padding: '6px', borderRadius: '6px', background: '#ffffff' }}>
                    {SIM_GRID_A.map((sym, i) => (
                      <div key={i} style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '4px', padding: 4 }}>
                        {sym && (
                          <img
                            src={`/simbolos/${sym}.png`}
                            alt=""
                            style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grade B */}
                <div>
                  <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-primary)' }}>
                    Imagem B (Achar a Diferença)
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', border: '1px solid var(--color-border)', padding: '6px', borderRadius: '6px', background: '#ffffff' }}>
                    {SIM_GRID_B.map((sym, i) => {
                      const isCorrectTarget = i === 5;
                      return (
                        <button
                          key={i}
                          onClick={() => handleCellClick(i)}
                          style={{
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isCorrectTarget && hasClickedCorrect ? 'var(--color-primary)' : '#ffffff',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                        >
                          {sym && (
                            <img
                              src={`/simbolos/${sym}.png`}
                              alt=""
                              style={{
                                width: '80%',
                                height: '80%',
                                objectFit: 'contain',
                                filter: isCorrectTarget && hasClickedCorrect ? 'brightness(0) invert(1)' : 'none',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Feedback dinâmico */}
              {showFeedback && (
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: hasClickedCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: hasClickedCorrect ? '#22c55e' : '#ef4444',
                  border: `1px solid ${hasClickedCorrect ? '#22c55e' : '#ef4444'}`
                }}>
                  {hasClickedCorrect
                    ? 'Muito bem! Você encontrou a célula diferente.'
                    : 'Tente novamente! Olhe para a segunda linha, na última coluna.'}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── STEP DONE: Pronto para o Jogo Real ── */}
        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '3rem', margin: '0 auto' }}>🚀</span>
              <h2 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Prática concluída!
              </h2>

              <h2 style={{ margin: '8px 0 0 0', textTransform: 'uppercase', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                Você entendeu como funciona?
              </h2>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                O escaner e as respostas rápidas garantirão um melhor resultado!
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <Button
                  variant="primary"
                  onClick={advance}
                  style={{ width: '100%', backgroundColor: 'var(--color-primary)', padding: '12px 16px', fontSize: '15px' }}
                >
                  Ir para o Treino de Atenção →
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep(1);
                    setHasClickedCorrect(false);
                    setShowFeedback(false);
                  }}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
                >
                  Repetir o Simulado
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
