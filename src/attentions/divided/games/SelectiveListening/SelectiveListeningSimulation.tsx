import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      className={`flex flex-col items-center rounded-2xl border-2 px-6 py-5 w-36 transition-colors
        ${highlighted
          ? 'border-blue-400 bg-blue-900/50'
          : 'border-neutral-600 bg-neutral-800'
        }`}
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-4">
        {label}
      </span>

      <div className="flex gap-2 h-8 items-center">
        <AnimatePresence>
          {showDigits &&
            digits.map((digit, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.25 }}
                className={`text-xl font-bold ${
                  highlighted ? 'text-blue-300' : 'text-neutral-500'
                }`}
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

  const advance = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 'done') onDone();
  };

  const checkAnswer = () => {
    setRevealed(true);
    setStep('done');
  };

  const isFemTarget = SIM_TARGET_VOICE === 'feminina';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-neutral-900 px-6 py-10 text-white">
      {/* ── STEP 1 — Introdução das duas vozes ── */}
      {step === 1 && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-6"
        >
          <h2 className="text-xl font-bold">Você vai ouvir duas vozes ao mesmo tempo</h2>
          <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
            Uma voz masculina e uma voz feminina falam números diferentes ao mesmo tempo,
            como duas pessoas conversando ao seu redor.
          </p>

          <div className="flex gap-8 mt-2">
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

          <button
            onClick={advance}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500"
          >
            Entendi →
          </button>
        </motion.div>
      )}

      {/* ── STEP 2 — Destaca a voz-alvo ── */}
      {step === 2 && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-6"
        >
          <h2 className="text-xl font-bold">
            Antes de cada rodada, vamos indicar qual voz seguir
          </h2>
          <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
            Neste exemplo, a voz-alvo é a{' '}
            <span className="font-bold text-blue-300">feminina</span>.
            Ignore a outra.
          </p>

          <div className="flex gap-8 mt-2">
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

          <div className="mt-1 rounded-xl border border-blue-500 bg-blue-900/30 px-5 py-3 text-blue-200 text-sm font-medium">
            👆 Ouça a voz feminina
          </div>

          <button
            onClick={advance}
            className="mt-2 rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500"
          >
            Próximo →
          </button>
        </motion.div>
      )}

      {/* ── STEP 3 — Sequência chega ── */}
      {step === 3 && (
        <motion.div
          key="step3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-6"
        >
          <h2 className="text-xl font-bold">As duas vozes falam ao mesmo tempo</h2>
          <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
            Cada voz fala 3 números. Você precisa guardar apenas os da voz-alvo.
          </p>

          <div className="flex gap-8 mt-2">
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

          <p className="text-xs text-neutral-400 max-w-xs mt-1">
            Os números acima representam o que cada voz falou. No treino real,
            você vai <span className="text-white font-medium">ouvir</span>, não ver.
          </p>

          <button
            onClick={advance}
            className="mt-2 rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500"
          >
            Tentar responder →
          </button>
        </motion.div>
      )}

      {/* ── STEP 4 — Resposta guiada ── */}
      {step === 4 && !revealed && (
        <motion.div
          key="step4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-6"
        >
          <h2 className="text-xl font-bold">Agora você digita os números</h2>
          <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
            Digite os 3 números que a{' '}
            <span className="font-bold text-blue-300">voz feminina</span> falou, na ordem.
          </p>

          <div className="flex gap-8 mt-2">
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

          <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-xs">
            <input
              value={answer}
              onChange={(e) =>
                setAnswer(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))
              }
              className="w-full rounded-xl border border-neutral-500 bg-neutral-800 px-4 py-3 text-center text-2xl tracking-widest text-white focus:border-blue-400 focus:outline-none"
              inputMode="numeric"
              placeholder="_ _ _"
              autoFocus
            />
            <p className="text-xs text-neutral-500">
              Dica: os números estavam visíveis na tela anterior 😉
            </p>
            <button
              onClick={checkAnswer}
              disabled={answer.length !== 3}
              className="w-full rounded-lg bg-green-600 px-6 py-3 font-medium hover:bg-green-500 disabled:opacity-40"
            >
              Confirmar
            </button>
          </div>
        </motion.div>
      )}

      {/* ── DONE — Resultado explicado ── */}
      {step === 'done' && revealed && (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-6 max-w-xs"
        >
          {answer === SIM_TARGET_DIGITS.join('') ? (
            <>
              <span className="text-5xl">🎯</span>
              <h2 className="text-xl font-bold text-green-400">Correto!</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">
                Você ignorou a voz masculina{' '}
                <span className="text-neutral-500">
                  ({SIM_DISTRACTOR_DIGITS.join(' ')})
                </span>{' '}
                e focou apenas na voz feminina{' '}
                <span className="text-blue-300 font-bold">
                  ({SIM_TARGET_DIGITS.join(' ')})
                </span>
                . É exatamente isso que você vai fazer no treino.
              </p>
            </>
          ) : (
            <>
              <span className="text-5xl">💡</span>
              <h2 className="text-xl font-bold text-yellow-300">Quase lá</h2>
              <p className="text-neutral-300 text-sm leading-relaxed">
                Os números da voz feminina eram{' '}
                <span className="text-blue-300 font-bold">
                  {SIM_TARGET_DIGITS.join(' ')}
                </span>
                . Não se preocupe — no treino real você vai{' '}
                <span className="text-white font-medium">ouvir</span> as vozes,
                o que torna mais fácil distinguir as duas.
              </p>
            </>
          )}

          <div className="rounded-xl bg-neutral-800 border border-neutral-600 px-5 py-4 text-sm text-left w-full space-y-1">
            <p>
              <span className="text-neutral-400">Voz masculina disse:</span>{' '}
              <span className="text-neutral-500 line-through">
                {SIM_DISTRACTOR_DIGITS.join(' ')}
              </span>
              <span className="ml-2 text-xs text-neutral-600">(ignorar)</span>
            </p>
            <p>
              <span className="text-neutral-400">Voz feminina disse:</span>{' '}
              <span className="text-blue-300 font-bold">
                {SIM_TARGET_DIGITS.join(' ')}
              </span>
              <span className="ml-2 text-xs text-green-500">(✓ alvo)</span>
            </p>
            <p>
              <span className="text-neutral-400">Sua resposta:</span>{' '}
              <span
                className={
                  answer === SIM_TARGET_DIGITS.join('')
                    ? 'text-green-400 font-bold'
                    : 'text-red-400'
                }
              >
                {answer.split('').join(' ')}
              </span>
            </p>
          </div>

          <button
            onClick={onDone}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500"
          >
            Começar o treino →
          </button>
        </motion.div>
      )}
    </div>
  );
}
