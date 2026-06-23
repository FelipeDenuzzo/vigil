import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';
import { SelectiveListeningInstructions } from './SelectiveListeningInstructions';
import SelectiveListeningSimulation from './SelectiveListeningSimulation';
import { TentativaRodada, VozAlvo } from '../../../../assessment/selectiveListening/types';

interface Props {
  sessionId: string;
  onClose?: () => void;
  onComplete?: (resultado: { rodadas: TentativaRodada[]; startedAt: string }) => void;
}

interface RoundConfig {
  targetVoice: VozAlvo;
  targetDigits: number[];
  distractorDigits: number[];
}

const ROUNDS_CONFIG: RoundConfig[] = [
  { targetVoice: 'feminina',  targetDigits: [3, 7, 1],       distractorDigits: [8, 4, 6] },
  { targetVoice: 'masculina', targetDigits: [5, 2, 9],       distractorDigits: [1, 7, 8] },
  { targetVoice: 'feminina',  targetDigits: [4, 8, 2, 6],    distractorDigits: [9, 3, 5, 1] },
  { targetVoice: 'masculina', targetDigits: [7, 1, 9, 3],    distractorDigits: [2, 6, 8, 4] },
  { targetVoice: 'feminina',  targetDigits: [8, 3, 5, 2, 9], distractorDigits: [6, 1, 7, 4, 0] },
  { targetVoice: 'masculina', targetDigits: [2, 9, 1, 6, 4], distractorDigits: [5, 8, 3, 7, 0] },
];

export const SelectiveListening: React.FC<Props> = ({ sessionId: _sessionId, onClose, onComplete }) => {
  const [phase, setPhase] = useState<'instructions' | 'simulation' | 'ready' | 'playing' | 'submitting'>('instructions');
  
  // Confirmação de uso de fones
  const [usedHeadphones, setUsedHeadphones] = useState(false);

  // Rodada atual
  const [roundIdx, setRoundIdx] = useState(0);
  const [roundStep, setRoundStep] = useState<'cue' | 'playingAudio' | 'input'>('cue');
  
  // Resposta do usuário na rodada ativa
  const [typedDigits, setTypedDigits] = useState<number[]>([]);
  const [replayCount, setReplayCount] = useState(0);

  // Histórico de rodadas concluintes
  const roundHistoryRef = useRef<TentativaRodada[]>([]);
  const startedAtRef = useRef<string>('');

  // Audio references para controle de interrupção
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);
  const currentTargetAudiosRef = useRef<HTMLAudioElement[]>([]);
  const currentDistractorAudiosRef = useRef<HTMLAudioElement[]>([]);

  // Timers e referências temporais
  const playbackStartRef = useRef<number>(0);
  const playbackDurationRef = useRef<number>(0);
  const inputStartRef = useRef<number>(0);

  const activeConfig = ROUNDS_CONFIG[roundIdx] || ROUNDS_CONFIG[0];
  const requiredLen = activeConfig.targetDigits.length;

  useEffect(() => {
    return () => {
      // Cleanup de qualquer áudio tocando se desmontar
      stopAllAudios();
      [...currentTargetAudiosRef.current, ...currentDistractorAudiosRef.current].forEach(a => {
        try {
          a.pause();
        } catch (e) {}
      });
    };
  }, []);

  const prepareRoundAudios = (idx: number) => {
    const config = ROUNDS_CONFIG[idx] || ROUNDS_CONFIG[0];
    const targetKey = config.targetVoice === 'masculina' ? 'male' : 'female';
    const distractorKey = config.targetVoice === 'masculina' ? 'female' : 'male';

    const tAudios = config.targetDigits.map(
      (digit) => new Audio(`/audio/selective-listening/${targetKey}/${digit}.mp3`)
    );
    const dAudios = config.distractorDigits.map(
      (digit) => new Audio(`/audio/selective-listening/${distractorKey}/${digit}.mp3`)
    );

    tAudios.forEach(a => a.preload = 'auto');
    dAudios.forEach(a => a.preload = 'auto');

    currentTargetAudiosRef.current = tAudios;
    currentDistractorAudiosRef.current = dAudios;

    // Desbloqueia todos os áudios sincronamente no evento do clique do usuário
    [...tAudios, ...dAudios].forEach((audio) => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch((e) => {
        console.warn('Erro ao pré-desbloquear áudio da rodada:', e);
      });
    });
  };

  const warmUpRoundAudios = () => {
    [...currentTargetAudiosRef.current, ...currentDistractorAudiosRef.current].forEach((audio) => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch((e) => {
        console.warn('Erro ao re-desbloquear áudio:', e);
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
  };

  const handleStartGame = () => {
    startedAtRef.current = new Date().toISOString();
    setPhase('simulation');
  };

  const handleSimulationDone = () => {
    setPhase('ready');
  };

  const handleReady = (headphones: boolean) => {
    setUsedHeadphones(headphones);
    setPhase('playing');
    setRoundIdx(0);
    roundHistoryRef.current = [];
    
    // Pré-carrega e desbloqueia os áudios da rodada 0 no clique do botão
    prepareRoundAudios(0);

    startRound(0);
  };

  const startRound = (idx: number) => {
    setRoundIdx(idx);
    setTypedDigits([]);
    setReplayCount(0);
    setRoundStep('cue');
    stopAllAudios();

    // Mostra o cue visual por 2.5s, depois começa a tocar
    setTimeout(() => {
      playAudioSequence(idx);
    }, 2500);
  };

  const playAudioSequence = async (idx: number) => {
    setRoundStep('playingAudio');
    stopAllAudios();

    const config = ROUNDS_CONFIG[idx] || ROUNDS_CONFIG[0];
    const len = config.targetDigits.length;

    const tAudios = currentTargetAudiosRef.current;
    const dAudios = currentDistractorAudiosRef.current;

    tAudios.forEach(a => a.currentTime = 0);
    dAudios.forEach(a => a.currentTime = 0);

    activeAudiosRef.current = [...tAudios, ...dAudios];

    // Aguarda um pequeno tempo para garantir carregamento
    await new Promise((resolve) => setTimeout(resolve, 300));

    playbackStartRef.current = Date.now();

    // Toca os dígitos concorrentemente com delay de 1.2s entre cada um
    for (let i = 0; i < len; i++) {
      if (activeAudiosRef.current.length === 0) return; // Parado no cleanup
      
      tAudios[i].play().catch((e) => console.warn('Erro ao tocar alvo:', e));
      dAudios[i].play().catch((e) => console.warn('Erro ao tocar distrator:', e));

      if (i < len - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    // Aguarda a reprodução final do último dígito (cerca de 1s)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    playbackDurationRef.current = Date.now() - playbackStartRef.current;
    
    // Libera para entrada do usuário
    setRoundStep('input');
    inputStartRef.current = Date.now();
  };

  const handleReplay = () => {
    if (replayCount >= 1) return;
    setReplayCount((prev) => prev + 1);
    
    // Re-desbloqueia no clique antes de tocar de forma assíncrona
    warmUpRoundAudios();

    playAudioSequence(roundIdx);
  };

  const handleKeyPress = (num: number) => {
    if (typedDigits.length < requiredLen) {
      setTypedDigits((prev) => [...prev, num]);
    }
  };

  const handleBackspace = () => {
    setTypedDigits((prev) => prev.slice(0, -1));
  };

  const handleSubmit = (isOmission = false) => {
    const latency = Date.now() - inputStartRef.current;
    const finalResponse = isOmission ? [] : typedDigits;

    const roundData: TentativaRodada = {
      roundNumber: roundIdx + 1,
      roundStartAt: new Date(Date.now() - latency - playbackDurationRef.current).toISOString(),
      targetVoice: activeConfig.targetVoice,
      targetDigits: activeConfig.targetDigits,
      distractorDigits: activeConfig.distractorDigits,
      responseDigits: finalResponse,
      responseLatencyMs: latency,
      playbackDurationMs: playbackDurationRef.current,
      replayCount,
      usedHeadphonesAcknowledged: usedHeadphones,
      submitted: true,
      omission: isOmission || finalResponse.length === 0,
    };

    roundHistoryRef.current.push(roundData);

    const nextIdx = roundIdx + 1;
    if (nextIdx < ROUNDS_CONFIG.length) {
      // Pré-carrega e desbloqueia os áudios da próxima rodada no clique do botão
      prepareRoundAudios(nextIdx);
      startRound(nextIdx);
    } else {
      // Salva e finaliza sessão
      finishSession();
    }
  };

  const finishSession = () => {
    setPhase('submitting');
    if (onComplete) {
      onComplete({
        rodadas: roundHistoryRef.current,
        startedAt: startedAtRef.current,
      });
    }
  };

  // Atalhos de teclado físico
  useEffect(() => {
    if (phase !== 'playing' || roundStep !== 'input') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(Number(e.key));
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (typedDigits.length === requiredLen) {
          handleSubmit(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, roundStep, typedDigits, requiredLen]);

  return (
    <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
      <AnimatePresence mode="wait">
        
        {/* ── FASE 1: INSTRUÇÕES ── */}
        {phase === 'instructions' && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <SelectiveListeningInstructions onStart={handleStartGame} onClose={onClose} />
          </motion.div>
        )}

        {/* ── FASE 2: SIMULAÇÃO / TUTORIAL ── */}
        {phase === 'simulation' && (
          <motion.div
            key="simulation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SelectiveListeningSimulation onDone={handleSimulationDone} />
          </motion.div>
        )}

        {/* ── FASE 3: CHEQUE DE FONES (READY) ── */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{ padding: 'var(--space-8)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <span style={{ fontSize: '3rem' }}>🎧</span>
              <h2 style={{ fontSize: '20px', color: 'var(--color-divided)', fontWeight: 700 }}>
                Aparelho de Som
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: '1.6' }}>
                Este treino utiliza áudios concorrentes simultâneos tocando em estéreo.
                Para obter a melhor eficácia de filtragem atencional, recomendamos fortemente o uso de <strong>fones de ouvido</strong>.
              </p>
              
              <div style={{ display: 'grid', gap: '12px', marginTop: '8px' }}>
                <Button
                  variant="primary"
                  onClick={() => handleReady(true)}
                  style={{ backgroundColor: 'var(--color-divided)', height: '48px' }}
                >
                  Estou usando Fones 🎧
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleReady(false)}
                  style={{ border: '1px solid rgba(255,255,255,0.1)', height: '48px' }}
                >
                  Usando Alto-Falantes 🔊
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── FASE 4: RODADAS DE TREINO ── */}
        {phase === 'playing' && (
          <motion.div
            key={`round-${roundIdx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Card style={{ padding: 'var(--space-6)', minHeight: '440px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Header da Rodada */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-faint)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Atenção Dividida
                </span>
                <span style={{ color: 'var(--color-divided)', fontSize: '14px', fontWeight: 'bold' }}>
                  Rodada {roundIdx + 1} de {ROUNDS_CONFIG.length}
                </span>
              </div>

              {/* Corpo da Etapa 1: CUE VISUAL */}
              {roundStep === 'cue' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', paddingBlock: 'var(--space-6)' }}>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ fontSize: '4.5rem' }}
                  >
                    {activeConfig.targetVoice === 'feminina' ? '👩' : '🧔'}
                  </motion.div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-divided)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ouça a voz {activeConfig.targetVoice}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', maxWidth: '320px' }}>
                    Prepare-se para ignorar a outra voz e guardar a sequência desta voz.
                  </p>
                </div>
              )}

              {/* Corpo da Etapa 2: TOCANDO ÁUDIO */}
              {roundStep === 'playingAudio' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '20px' }}>
                  {/* Equalizador ou Pulsador premium */}
                  <div style={{ display: 'flex', gap: '6px', height: '40px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <motion.div
                        key={val}
                        animate={{ height: [12, 40, 12] }}
                        transition={{ repeat: Infinity, duration: 0.6 + val * 0.1, ease: 'easeInOut' }}
                        style={{ width: '4px', background: 'var(--color-divided)', borderRadius: '2px' }}
                      />
                    ))}
                  </div>
                  
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                    Ouvindo vozes concorrentes...
                  </span>
                  
                  <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>
                    Mantenha o foco na voz {activeConfig.targetVoice}!
                  </span>
                </div>
              )}

              {/* Corpo da Etapa 3: ENTRADA DE DADOS (KEYPAD) */}
              {roundStep === 'input' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
                  
                  {/* Target reminder & visor de resposta */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                      Voz-alvo: <strong>{activeConfig.targetVoice === 'feminina' ? '👩 Feminina' : '🧔 Masculina'}</strong>
                    </span>

                    {/* Visor de bolinhas/números */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', height: '52px', alignItems: 'center' }}>
                      {Array.from({ length: requiredLen }).map((_, i) => {
                        const digit = typedDigits[i];
                        const hasDigit = digit !== undefined;
                        return (
                          <motion.div
                            key={i}
                            animate={hasDigit ? { scale: [0.9, 1.1, 1] } : {}}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              border: hasDigit ? '2px solid var(--color-divided)' : '2px dashed var(--color-border)',
                              background: hasDigit ? 'rgba(108, 142, 245, 0.1)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: 'var(--color-text)'
                            }}
                          >
                            {hasDigit ? digit : ''}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teclado Virtual Numérico */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '320px', margin: '0 auto', width: '100%' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleKeyPress(num)}
                        style={{
                          height: '44px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.03)',
                          color: 'var(--color-text)',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {num}
                      </button>
                    ))}
                    
                    {/* Linha final do teclado */}
                    <button
                      onClick={handleBackspace}
                      style={{
                        height: '44px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#f08080',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Apagar
                    </button>

                    <button
                      onClick={() => handleKeyPress(0)}
                      style={{
                        height: '44px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--color-text)',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      0
                    </button>

                    <button
                      onClick={() => handleSubmit(true)}
                      style={{
                        height: '44px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--color-text-muted)',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Pular
                    </button>
                  </div>

                  {/* Ações adicionais */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                    <Button
                      variant="secondary"
                      onClick={handleReplay}
                      disabled={replayCount >= 1}
                      style={{ flex: 1, fontSize: '13px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', opacity: replayCount >= 1 ? 0.35 : 1 }}
                    >
                      Repetir Áudio ({1 - replayCount})
                    </Button>
                    
                    <Button
                      variant="primary"
                      onClick={() => handleSubmit(false)}
                      disabled={typedDigits.length !== requiredLen}
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-sustained)',
                        opacity: typedDigits.length === requiredLen ? 1 : 0.4
                      }}
                    >
                      Confirmar →
                    </Button>
                  </div>

                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── FASE 5: SUBMITTING / CARREGANDO RESULTADOS ── */}
        {phase === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: 'var(--space-8)' }}
          >
            <h3 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              Finalizando treino...
            </h3>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-divided)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default SelectiveListening;
