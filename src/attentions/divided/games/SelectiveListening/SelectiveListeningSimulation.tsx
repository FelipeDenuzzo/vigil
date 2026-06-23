import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  onDone: () => void;
}

type SimStep = 1 | 2 | 3 | 4 | 'done';

const SIM_TARGET_VOICE = 'feminina' as const;
const SIM_TARGET_DIGITS = [3, 7, 1];
const SIM_DISTRACTOR_DIGITS = [8, 4, 6];

function VoiceCard({
  label,
  digits,
  highlighted,
  showDigits,
  icon,
}: {
  label: string;
  digits: number[];
  highlighted: boolean;
  showDigits: boolean;
  icon: string;
}) {
  return (
    <motion.div
      animate={{
        scale: highlighted ? 1.06 : 1,
        opacity: highlighted ? 1 : 0.45,
      }}
      transition={{ duration: 0.35 }}
      style={{
        flexDirection: 'column',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-lg)',
        border: highlighted ? '2px solid var(--color-divided)' : '2px solid var(--color-border)',
        backgroundColor: highlighted ? 'rgba(108, 142, 245, 0.1)' : 'var(--color-surface-2)',
        padding: 'var(--space-4) var(--space-6)',
        width: '120px',
        transition: 'border-color 0.3s, background-color 0.3s'
      }}
    >
      <span style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{icon}</span>
      <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', marginBottom: 'var(--space-3)' }}>
        {label}
      </span>

      <div style={{ display: 'flex', gap: 'var(--space-2)', height: '24px', alignItems: 'center' }}>
        <AnimatePresence>
          {showDigits &&
            digits.map((digit, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.25 }}
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: highlighted ? 'var(--color-divided)' : 'var(--color-text-faint)'
                }}
              >
                {digit}
              </motion.span>
            ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function SelectiveListeningSimulation({ onDone }: Props) {
  const [step, setStep] = useState<SimStep>(1);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const targetAudiosRef = useRef<HTMLAudioElement[]>([]);
  const distractorAudiosRef = useRef<HTMLAudioElement[]>([]);
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);

  useEffect(() => {
    const targetKey = 'female';
    const distractorKey = 'male';

    targetAudiosRef.current = SIM_TARGET_DIGITS.map(
      (digit) => new Audio(`/audio/selective-listening/${targetKey}/${digit}.mp3`)
    );
    distractorAudiosRef.current = SIM_DISTRACTOR_DIGITS.map(
      (digit) => new Audio(`/audio/selective-listening/${distractorKey}/${digit}.mp3`)
    );

    targetAudiosRef.current.forEach(a => a.preload = 'auto');
    distractorAudiosRef.current.forEach(a => a.preload = 'auto');

    return () => {
      [...targetAudiosRef.current, ...distractorAudiosRef.current].forEach(a => {
        try {
          a.pause();
        } catch (e) {}
      });
    };
  }, []);

  const warmUpAudios = () => {
    [...targetAudiosRef.current, ...distractorAudiosRef.current].forEach((audio) => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch((e) => {
        console.warn('Erro ao desbloquear áudio da simulação:', e);
      });
    });
  };

  const stopAllAudios = () => {
    activeAudiosRef.current.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        // ignore
      }
    });
    activeAudiosRef.current = [];
    setIsPlayingAudio(false);
  };

  const playSimAudio = async () => {
    stopAllAudios();
    setIsPlayingAudio(true);

    const len = SIM_TARGET_DIGITS.length;
    const tAudios = targetAudiosRef.current;
    const dAudios = distractorAudiosRef.current;

    tAudios.forEach(a => a.currentTime = 0);
    dAudios.forEach(a => a.currentTime = 0);

    activeAudiosRef.current = [...tAudios, ...dAudios];

    // Aguarda um pequeno tempo para garantir carregamento
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Toca os dígitos concorrentemente com delay de 1.2s entre cada um
    for (let i = 0; i < len; i++) {
      if (activeAudiosRef.current.length === 0) return; // Parado no cleanup ou avanço
      
      tAudios[i].play().catch((e) => console.warn('Erro ao tocar alvo na simulação:', e));
      dAudios[i].play().catch((e) => console.warn('Erro ao tocar distrator na simulação:', e));

      if (i < len - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    // Aguarda o término da última reprodução (cerca de 1s)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    if (step === 3) {
      playSimAudio();
    } else {
      stopAllAudios();
    }
    return () => stopAllAudios();
  }, [step]);

  const advance = () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      warmUpAudios();
      setStep(3);
    }
    else if (step === 3) setStep(4);
    else if (step === 'done') onDone();
  };

  const checkAnswer = () => {
    setRevealed(true);
    setStep('done');
  };

  const isFemTarget = SIM_TARGET_VOICE === 'feminina';

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: 'var(--space-4)' }}>
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
        {/* ── STEP 1 — Duas vozes concorrentes ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>🔊</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Como Funciona o Treino?
              </h2>
              <p style={{ color: '#ffffff', marginBottom: 'var(--space-6)', fontSize: '18px', lineHeight: '1.6' }}>
                Você vai ouvir duas vozes falando números diferentes ao mesmo tempo, como se fossem duas conversas paralelas.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <VoiceCard
                  label="Masculina"
                  icon="🧔"
                  digits={SIM_DISTRACTOR_DIGITS}
                  highlighted={false}
                  showDigits={false}
                />
                <VoiceCard
                  label="Feminina"
                  icon="👩"
                  digits={SIM_TARGET_DIGITS}
                  highlighted={false}
                  showDigits={false}
                />
              </div>

              <Button
                variant="primary"
                onClick={advance}
                style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
              >
                Entendi →
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 2 — Destacando a voz-alvo ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>🎯</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Indicação da Voz-Alvo
              </h2>
              <p style={{ color: '#ffffff', marginBottom: 'var(--space-5)', fontSize: '18px', lineHeight: '1.6' }}>
                Antes do áudio tocar, uma mensagem indicará qual voz você deve seguir. Neste exemplo, a voz-alvo é a <strong style={{ color: 'var(--color-divided)' }}>feminina</strong>.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
                <VoiceCard
                  label="Masculina"
                  icon="🧔"
                  digits={SIM_DISTRACTOR_DIGITS}
                  highlighted={false}
                  showDigits={false}
                />
                <VoiceCard
                  label="Feminina"
                  icon="👩"
                  digits={SIM_TARGET_DIGITS}
                  highlighted={true}
                  showDigits={false}
                />
              </div>

              <div style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-divided)',
                backgroundColor: 'rgba(108, 142, 245, 0.08)',
                padding: 'var(--space-3) var(--space-4)',
                color: 'var(--color-divided)',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: 'var(--space-5)'
              }}>
                🎧 Preste atenção na voz feminina! Ignore o homem.
              </div>

              <Button
                variant="primary"
                onClick={advance}
                style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
              >
                Próximo →
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 3 — Chegada concorrente da sequência ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>⚡</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Ouvindo a Sequência
              </h2>
              <p style={{ color: '#ffffff', marginBottom: 'var(--space-5)', fontSize: '18px', lineHeight: '1.6' }}>
                Cada canal reproduzirá 3 números simultaneamente. Lembre-se apenas dos dígitos da voz feminina.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
                <VoiceCard
                  label="Masculina"
                  icon="🧔"
                  digits={SIM_DISTRACTOR_DIGITS}
                  highlighted={!isFemTarget}
                  showDigits={true}
                />
                <VoiceCard
                  label="Feminina"
                  icon="👩"
                  digits={SIM_TARGET_DIGITS}
                  highlighted={isFemTarget}
                  showDigits={true}
                />
              </div>

              {/* Feedback visual de reprodução do áudio */}
              {isPlayingAudio ? (
                <div style={{ display: 'flex', gap: '4px', height: '24px', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <motion.div
                      key={val}
                      animate={{ height: [8, 24, 8] }}
                      transition={{ repeat: Infinity, duration: 0.5 + val * 0.1, ease: 'easeInOut' }}
                      style={{ width: '3px', background: 'var(--color-divided)', borderRadius: '1.5px' }}
                    />
                  ))}
                  <span style={{ fontSize: '11px', color: 'var(--color-divided)', marginLeft: '8px', fontWeight: 'bold' }}>
                    Tocando áudio...
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: '#ffffff', display: 'block', marginBottom: 'var(--space-4)' }}>
                  * No treino de verdade você só vai <strong>ouvir</strong> os números, sem vê-los na tela.
                </span>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    warmUpAudios();
                    playSimAudio();
                  }}
                  disabled={isPlayingAudio}
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', opacity: isPlayingAudio ? 0.35 : 1 }}
                >
                  Repetir Áudio
                </Button>
                
                <Button
                  variant="primary"
                  onClick={advance}
                  style={{ flex: 1, backgroundColor: 'var(--color-divided)' }}
                >
                  Tentar Responder →
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 4 — Entrada da resposta ── */}
        {step === 4 && !revealed && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-2)' }}>⌨️</span>
              <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Agora é Sua Vez!
              </h2>
              <p style={{ color: '#ffffff', marginBottom: 'var(--space-6)', fontSize: '14px', lineHeight: '1.6' }}>
                Digite os 3 números ditados pela <strong style={{ color: 'var(--color-divided)' }}>voz feminina</strong> na ordem correta:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder="DIGITE"
                  style={{
                    width: '100%',
                    maxWidth: '180px',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    letterSpacing: '0.2em'
                  }}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>
                  Dica: os números estavam na tela anterior ({SIM_TARGET_DIGITS.join(' ')}) 😉
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
                Confirmar
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ── DONE — Feedback Final da Simulação ── */}
        {step === 'done' && revealed && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
              {answer === SIM_TARGET_DIGITS.join('') ? (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-2)' }}>🎯</span>
                  <h2 style={{ margin: 0, color: 'var(--color-sustained)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                    Excelente! Correto!
                  </h2>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-2)' }}>💡</span>
                  <h2 style={{ margin: 0, color: '#f08080', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                    Bom Teste!
                  </h2>
                </>
              )}

              <h2 style={{ margin: '8px 0 var(--space-4) 0', textTransform: 'uppercase', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                Você entendeu como funciona?
              </h2>

              <p style={{ color: '#ffffff', marginBottom: 'var(--space-5)', fontSize: '14px', lineHeight: '1.6' }}>
                {answer === SIM_TARGET_DIGITS.join('') ? (
                  <>Você filtrou a voz masculina distratora e gravou a sequência correta da voz feminina: <strong style={{ color: 'var(--color-divided)' }}>{SIM_TARGET_DIGITS.join(' ')}</strong>.</>
                ) : null}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  variant="primary"
                  onClick={advance}
                  style={{ backgroundColor: 'var(--color-divided)', width: '100%', padding: '12px 16px', fontSize: '15px' }}
                >
                  Ir para o Treino de Atenção →
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep(1);
                    setAnswer('');
                    setRevealed(false);
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
