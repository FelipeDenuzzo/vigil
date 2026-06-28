// src/attentions/alternating/games/Insetos/InsetosSimulation.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  onDone: () => void;
  onBack: () => void;
}

type SimStep = 1 | 2 | 'done';

function SimInsect({
  group,
  alert,
  active,
}: {
  group: 'formiga' | 'joaninha';
  alert: boolean;
  active: boolean;
}) {
  const imgSrc = group === 'formiga'
    ? '/Insetos/Formiga integra.png'
    : '/Insetos/Joaninha Integra.png';
  const borderColor = group === 'formiga' ? '#f97316' : '#ef4444';

  return (
    <div
      style={{
        width: 72, height: 72, borderRadius: '50%',
        border: alert ? `3px solid ${borderColor}` : '2px solid rgba(255,255,255,0.15)',
        background: alert
          ? `rgba(${group === 'formiga' ? '249,115,22' : '239,68,68'},0.2)`
          : 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: active ? 1 : 0.6,
        animation: alert ? 'pulse 0.8s infinite alternate' : 'none',
      }}
    >
      <img src={imgSrc} alt={group} style={{ width: 44, height: 44, objectFit: 'contain' }} />
    </div>
  );
}

export default function InsetosSimulation({ onDone, onBack }: Props) {
  const [step, setStep] = useState<SimStep>(1);

  return (
    <>
      <style>{`
        @keyframes pulse {
          from { box-shadow: 0 0 0 0 rgba(249,115,22,0.5); }
          to   { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
        }
      `}</style>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px', width: '100%' }}>

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
                  <Button variant="primary" onClick={() => setStep('done')} style={{ width: '100%' }}>
                    Entendi, ver mais →
                  </Button>
                  <Button variant="ghost" onClick={onBack} style={{ width: '100%' }}>
                    ← Voltar
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}



          {/* ── DONE ── */}
          {step === 'done' && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            >
              <Card style={{ padding: 'var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: '3rem', margin: '0 auto' }}>🚀</span>
                <h2 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                  Pronto!
                </h2>
                <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.6, marginBottom: 8, textAlign: 'center', margin: '0 auto' }}>
                  Lembre-se: toque <em>apenas</em> nos insetos do grupo ativo quando eles pararem e piscarem. Velocidade e precisão contam!
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <Button variant="primary" onClick={onDone} style={{ width: '100%', fontSize: 15 }}>
                    Ir para o Treino →
                  </Button>
                  <Button variant="secondary" onClick={() => setStep(1)} style={{ width: '100%', fontSize: 15 }}>
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
