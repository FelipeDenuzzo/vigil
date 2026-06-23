// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoSimulation.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  onDone: () => void;
}

type SimStep = 1 | 2 | 3 | 'done';

const SIM_GRID_A = ['18', '19', '20', '21', '22', '23', '24', '25', '26'];
const SIM_GRID_B = ['18', '19', '20', '21', '22', '', '24', '25', '26']; // index 5 is missing!

export default function AcharOFaltandoSimulation({ onDone }: Props) {
  const [step, setStep] = useState<SimStep>(1);
  const [hasClickedCorrect, setHasClickedCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const advance = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
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
                Como Funciona o Achar o Faltando?
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Este treino testa a sua **Atenção Seletiva** e velocidade de processamento visual.
                Sua tarefa é comparar duas grades e encontrar o único elemento que está **diferente** (faltando ou sobrando).
              </p>
              
              <Button
                variant="primary"
                onClick={advance}
                style={{ marginTop: '8px', width: '100%' }}
              >
                Como identificar? →
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 2: Explicação da grade concorrente ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '3rem' }}>💡</span>
              <h2 style={{ color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Escanear e Comparar
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Uma das grades estará completa. A outra grade terá uma célula vazia (indicando o símbolo que falta) ou terá um símbolo diferente.
              </p>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: '13px',
                color: 'var(--color-text-muted)'
              }}>
                ℹ️ No jogo oficial, a disposição pode ser **Lado a Lado** ou **Alternante** (piscando na tela). Mantenha o foco estável!
              </div>
              <Button
                variant="primary"
                onClick={advance}
                style={{ width: '100%' }}
              >
                Fazer um Teste Prático! →
              </Button>
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
                  Compare a Grade A com a Grade B. Clique na célula vazia/diferente na **Grade B**.
                </p>
              </div>

              {/* Grades Lado a Lado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Grade A */}
                <div>
                  <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>
                    Grade A (Referência)
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
                    Grade B (Achar a Diferença)
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
                    ? 'Muito bem! Você encontrou a célula vazia.'
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
              <span style={{ fontSize: '3rem' }}>🚀</span>
              <h2 style={{ color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Tudo Pronto!
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Você aprendeu a mecânica. O treino real terá **10 rodadas** com tempo limite global de **3 minutos**. 
                O escaner e as respostas rápidas garantirão um melhor resultado!
              </p>
              
              <Button
                variant="primary"
                onClick={advance}
                style={{ width: '100%', backgroundColor: 'var(--color-primary)' }}
              >
                Iniciar Treino Real!
              </Button>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
