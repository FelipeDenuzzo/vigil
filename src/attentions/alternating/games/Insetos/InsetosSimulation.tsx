// src/attentions/alternating/games/Insetos/InsetosSimulation.tsx
// Modo de prática do jogo Insetos — exibe mecânica e permite interação antes do treino real.
// Espelha o padrão de AcharOFaltandoSimulation.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  onDone: () => void;
  onBack: () => void;
}

type SimStep = 1 | 2 | 3 | 'done';

/* Inseto simulado para demonstração de alerta */
function SimInsect({
  group,
  alert,
  active,
  onClick,
  showClickFeedback,
}: {
  group: 'formiga' | 'joaninha';
  alert: boolean;
  active: boolean;
  onClick?: () => void;
  showClickFeedback?: boolean;
}) {
  const imgSrc = group === 'formiga'
    ? '/Insetos/Formiga integra.png'
    : '/Insetos/Joaninha Integra.png';

  const borderColor = group === 'formiga' ? '#f97316' : '#ef4444';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        border: alert ? `3px solid ${borderColor}` : '2px solid rgba(255,255,255,0.15)',
        background: showClickFeedback
          ? 'rgba(34,197,94,0.25)'
          : alert
          ? `rgba(${group === 'formiga' ? '249,115,22' : '239,68,68'},0.1)`
          : 'rgba(255,255,255,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        opacity: active ? 1 : 0.35,
        animation: alert ? 'pulse 0.8s infinite alternate' : 'none',
        outline: 'none',
      }}
    >
      <img
        src={imgSrc}
        alt={group}
        style={{ width: 44, height: 44, objectFit: 'contain' }}
      />
    </button>
  );
}

export default function InsetosSimulation({ onDone, onBack }: Props) {
  const [step, setStep] = useState<SimStep>(1);
  const [clicked, setClicked] = useState<null | 'correct' | 'wrong'>(null);

  const advance = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep('done');
    else onDone();
  };

  const handleInsectClick = (isCorrect: boolean) => {
    if (clicked) return;
    setClicked(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setTimeout(() => setStep('done'), 1400);
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          from { box-shadow: 0 0 0 0 rgba(249,115,22,0.5); }
          to   { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
        }
      `}</style>

      <div style={{
        maxWidth: 920,
        margin: '0 auto',
        padding: '24px 16px',
        width: '100%',
      }}>

        {/* Badge modo prática */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)',
          color: '#eab308', padding: '8px 20px', borderRadius: 99,
          fontWeight: 'bold', fontSize: 16, letterSpacing: '0.05em',
          width: 'fit-content', margin: '0 auto 20px auto',
        }}>
          <span style={{ fontSize: 18 }}>🚧</span> MODO DE PRÁTICA
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Regra básica ── */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}
            >
              <Card style={{ padding: 'var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: '3rem' }}>🐜🐞</span>
                <h2 style={{ color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
                  Formigas e Joaninhas
                </h2>
                <p style={{ color: '#fff', fontSize: 'var(--text-base)', lineHeight: 1.6, margin: '0 auto', maxWidth: 420 }}>
                  Insetos se movem pela tela em dois grupos: <strong>formigas</strong> e <strong>joaninhas</strong>.
                  A cada fase, apenas <strong>um grupo está ativo</strong>. Você deve tocar <em>somente</em> nos insetos do grupo ativo quando eles <strong>piscarem e pararem</strong> — esse é o estado de <em>alerta</em>.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#f97316', fontWeight: 700, marginBottom: 6 }}>Fase: FORMIGA ativa</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <SimInsect group="formiga" alert active={true} />
                      <SimInsect group="joaninha" alert={false} active={false} />
                    </div>
                    <div style={{ fontSize: 11, color: '#a0a4be', marginTop: 6 }}>Toque na formiga em alerta ✓<br/>Ignore a joaninha ✗</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 700, marginBottom: 6 }}>Fase: JOANINHA ativa</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <SimInsect group="formiga" alert={false} active={false} />
                      <SimInsect group="joaninha" alert active={true} />
                    </div>
                    <div style={{ fontSize: 11, color: '#a0a4be', marginTop: 6 }}>Toque na joaninha em alerta ✓<br/>Ignore a formiga ✗</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <Button variant="primary" onClick={advance} style={{ width: '100%' }}>
                    Entendi, ver mais →
                  </Button>
                  <Button variant="ghost" onClick={onBack} style={{ width: '100%' }}>
                    ← Voltar
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: Alternância de fases ── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}
            >
              <Card style={{ padding: 'var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: '3rem' }}>🔄</span>
                <h2 style={{ color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
                  Alternância de Fases
                </h2>
                <p style={{ color: '#fff', fontSize: 'var(--text-base)', lineHeight: 1.6, margin: '0 auto', maxWidth: 440 }}>
                  O jogo tem <strong>6 fases de 30 segundos</strong> cada. A cada troca de fase, a borda da tela <strong>pisca</strong>
                  {' '}(<span style={{ color: '#f97316' }}>laranja = formiga</span>, <span style={{ color: '#ef4444' }}>vermelho = joaninha</span>) e um <strong>bip</strong> indica a mudança.
                  Fique atento: o grupo ativo muda e você precisa alternar o foco rapidamente.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[1,2,3,4,5,6].map(n => (
                    <div key={n} style={{
                      width: 44, height: 44, borderRadius: 8,
                      background: n % 2 === 1 ? 'rgba(249,115,22,0.2)' : 'rgba(239,68,68,0.2)',
                      border: `2px solid ${n % 2 === 1 ? '#f97316' : '#ef4444'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 700,
                    }}>
                      <span style={{ fontSize: 16 }}>{n % 2 === 1 ? '🐜' : '🐞'}</span>
                      F{n}
                    </div>
                  ))}
                </div>
                <p style={{ color: '#a0a4be', fontSize: 13, margin: 0 }}>
                  Fases ímpares = formigas ativas · Fases pares = joaninhas ativas
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <Button variant="primary" onClick={advance} style={{ width: '100%' }}>
                    Praticar agora →
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(1)} style={{ width: '100%' }}>
                    ← Voltar
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 3: Interação prática ── */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}
            >
              <Card style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                    Tente você mesmo!
                  </h3>
                  <p style={{ color: '#fff', fontSize: 13, marginTop: 6 }}>
                    A fase atual é <strong style={{ color: '#f97316' }}>FORMIGA</strong>. Toque na formiga que está em alerta (piscando).
                  </p>
                </div>

                {/* Arena de demonstração */}
                <div style={{
                  position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto',
                  height: 200, borderRadius: 16,
                  border: '3px solid #f97316',
                  background: '#0e1016',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 24,
                }}>
                  {/* Formiga em alerta — alvo correto */}
                  <SimInsect
                    group="formiga"
                    alert
                    active
                    onClick={() => handleInsectClick(true)}
                    showClickFeedback={clicked === 'correct'}
                  />
                  {/* Joaninha sem alerta — grupo errado */}
                  <SimInsect
                    group="joaninha"
                    alert={false}
                    active={false}
                    onClick={() => handleInsectClick(false)}
                  />
                  {/* Formiga sem alerta — sem alerta */}
                  <SimInsect
                    group="formiga"
                    alert={false}
                    active
                    onClick={() => handleInsectClick(false)}
                  />
                </div>

                {clicked && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      textAlign: 'center', padding: 10, borderRadius: 8,
                      fontSize: 13, fontWeight: 600,
                      backgroundColor: clicked === 'correct' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: clicked === 'correct' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${clicked === 'correct' ? '#22c55e' : '#ef4444'}`,
                    }}
                  >
                    {clicked === 'correct'
                      ? '✓ Correto! Você tocou na formiga em alerta.'
                      : '✗ Tente novamente! Toque na formiga que está piscando (borda laranja).'}
                  </motion.div>
                )}

                {clicked === 'wrong' && (
                  <Button variant="ghost" onClick={() => setClicked(null)} style={{ width: '100%' }}>
                    Tentar de novo
                  </Button>
                )}
              </Card>
            </motion.div>
          )}

          {/* ── DONE: Pronto para o jogo ── */}
          {step === 'done' && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            >
              <Card style={{ padding: 'var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: '3rem', margin: '0 auto' }}>🚀</span>
                <h2 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                  Prática concluída!
                </h2>
                <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
                  Agora você sabe como funciona. Lembre-se: toque <em>apenas</em> nos insetos do grupo ativo quando eles entrarem em alerta. Velocidade e precisão contam!
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <Button variant="primary" onClick={onDone} style={{ width: '100%', fontSize: 15 }}>
                    Ir para o Treino →
                  </Button>
                  <Button variant="secondary" onClick={() => { setStep(1); setClicked(null); }} style={{ width: '100%', fontSize: 15 }}>
                    Repetir o Simulado
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}
