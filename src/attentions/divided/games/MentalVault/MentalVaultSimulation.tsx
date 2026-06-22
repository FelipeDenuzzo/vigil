import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  onDone: () => void;
}

type SimStep = 1 | 2 | 3 | 4 | 'done';

const SIM_TARGET_LETTERS = ['D', 'M', 'L'];

export default function MentalVaultSimulation({ onDone }: Props) {
  const [step, setStep] = useState<SimStep>(1);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);

  const advance = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 'done') onDone();
  };

  const handleTextChange = (val: string) => {
    setAnswer(val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3));
  };

  const checkAnswer = () => {
    setRevealed(true);
    setStep('done');
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: 'var(--space-4)' }}>
      <AnimatePresence mode="wait">
        {/* ── STEP 1: Memorização de Letras ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>🧠</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
                Passo 1: Memorizar Letras
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', fontSize: '14px', lineHeight: '1.6' }}>
                Algumas consoantes aparecerão na tela uma por uma. Seu objetivo é guardar a sequência exata na memória.
              </p>

              {/* Simulação Visual das Letras */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                {SIM_TARGET_LETTERS.map((letter, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.4, type: 'spring', stiffness: 100 }}
                    style={{
                      width: '55px',
                      height: '55px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-2)',
                      border: '2px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 800,
                      color: 'var(--color-divided)'
                    }}
                  >
                    {letter}
                  </motion.div>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={advance}
                style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
              >
                Entendi, continuar →
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 2: Classificação de Números ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>⚡</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
                Passo 2: Atenção Dividida
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: '14px', lineHeight: '1.6' }}>
                Enquanto segura as letras na memória, números aparecerão rapidamente. Classifique-os usando as regras abaixo:
              </p>

              {/* Demonstração de Regra */}
              <div style={{
                textAlign: 'left',
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-5)',
                fontSize: '13px',
                lineHeight: '1.5'
              }}>
                <p style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#8aaaf7', marginRight: '6px', fontSize: '14px' }}>🔵</span>
                  <strong>Número Azul:</strong> Classifique como ÍMPAR (Esquerda) ou PAR (Direita).
                </p>
                <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#f08080', marginRight: '6px', fontSize: '14px' }}>🔴</span>
                  <strong>Número Vermelho:</strong> Classifique como MENOR QUE 5 (Esquerda) ou MAIOR QUE 5 (Direita).
                </p>
              </div>

              {/* Exemplo Interativo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid #f08080',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 900,
                  color: '#f08080',
                  fontFamily: 'monospace'
                }}>
                  7
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Exemplo: <span style={{ color: '#f08080', fontWeight: 'bold' }}>7 Vermelho</span> é maior que 5. Você deve clicar em:
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%' }}>
                  <div style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-surface-2)', opacity: 0.3, borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold' }}>
                    ESQUERDA
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-divided)', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 'bold', border: '1px solid white' }}
                  >
                    DIREITA ➔
                  </motion.div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={advance}
                style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
              >
                Entendi as regras →
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 3: Recordação / Recall ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>🔓</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
                Passo 3: Abrir o Cofre
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', fontSize: '14px', lineHeight: '1.6' }}>
                Após responder a todos os números, você deve digitar as letras memorizadas no Passo 1 na mesma ordem para abrir o cofre.
              </p>

              {/* Visual de Teclado Virtual / Slots */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <div style={{ width: '45px', height: '45px', borderBottom: '3px solid var(--color-divided)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--color-divided)' }}>D</div>
                  <div style={{ width: '45px', height: '45px', borderBottom: '3px solid var(--color-divided)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--color-divided)' }}>M</div>
                  <div style={{ width: '45px', height: '45px', borderBottom: '3px solid var(--color-divided)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--color-divided)' }}>L</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', maxWidth: '240px' }}>
                  {['D', 'F', 'L', 'M', 'R'].map((char) => (
                    <div key={char} style={{
                      padding: '8px 0',
                      backgroundColor: 'var(--color-surface-2)',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      opacity: (char === 'D' || char === 'M' || char === 'L') ? 1 : 0.4
                    }}>
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                onClick={advance}
                style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
              >
                Fazer teste rápido →
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 4: Teste Interativo Guiado ── */}
        {step === 4 && !revealed && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>🎮</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
                Passo 4: Tente Responder!
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', fontSize: '14px', lineHeight: '1.6' }}>
                Quais eram as 3 letras que mostramos no **Passo 1**? Digite-as na ordem correta:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="DIGITE AS LETRAS"
                  style={{
                    width: '100%',
                    maxWidth: '220px',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em'
                  }}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>
                  Dica: começava com "D" e terminava com "L" 😉
                </span>
              </div>

              <Button
                variant="primary"
                onClick={checkAnswer}
                disabled={answer.length !== 3}
                style={{
                  backgroundColor: 'var(--color-sustained)',
                  width: '100%',
                  opacity: answer.length === 3 ? 1 : 0.4
                }}
              >
                Confirmar Resposta
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 'done': Feedback Explicação ── */}
        {step === 'done' && revealed && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              {answer === SIM_TARGET_LETTERS.join('') ? (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-2)' }}>🎉</span>
                  <h2 style={{ color: 'var(--color-sustained)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
                    Excelente! Tudo Certo!
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', fontSize: '14px', lineHeight: '1.6' }}>
                    Você memorizou com precisão a sequência de letras{' '}
                    <strong style={{ color: 'var(--color-divided)' }}>{SIM_TARGET_LETTERS.join(' ')}</strong>.
                    No treino real, o desafio será fazer isso enquanto classifica 8 números rapidamente!
                  </p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-2)' }}>💡</span>
                  <h2 style={{ color: '#f08080', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
                    Bom Teste!
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', fontSize: '14px', lineHeight: '1.6' }}>
                    A sequência correta era{' '}
                    <strong style={{ color: 'var(--color-divided)' }}>{SIM_TARGET_LETTERS.join(' ')}</strong>.
                    No treino real, concentre-se em reter as letras visualmente enquanto responde aos números. Vamos começar?
                  </p>
                </>
              )}

              <div style={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                textAlign: 'left',
                fontSize: '13px',
                marginBottom: 'var(--space-6)'
              }}>
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Letras do Teste:</span>{' '}
                  <strong style={{ color: 'var(--color-divided)' }}>{SIM_TARGET_LETTERS.join(' ')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Sua Resposta:</span>{' '}
                  <strong style={{ color: answer === SIM_TARGET_LETTERS.join('') ? 'var(--color-sustained)' : '#f08080' }}>
                    {answer.split('').join(' ') || '-'}
                  </strong>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={advance}
                style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
              >
                Começar Treino Real!
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
