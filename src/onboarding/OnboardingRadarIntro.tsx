import { motion } from 'framer-motion';
import { OnboardingRadar } from './OnboardingRadar';
import type { UserBaseline } from './types';
import { useNavigate } from 'react-router-dom';

interface Props {
  baseline: UserBaseline;
  onAdvance: () => void;
}

const ATTENTION_TEXTS = [
  {
    key: 'Seletiva',
    color: 'var(--color-selective, #f5a76c)',
    text: 'Focar no que importa e ignorar o resto. Age quando você lê numa sala barulhenta ou procura um rosto numa multidão.',
  },
  {
    key: 'Sustentada',
    color: 'var(--color-sustained, #6cf5a7)',
    text: 'Manter o foco por um período contínuo sem deixar a mente viajar. Exigida em aulas longas, leituras ou tarefas que demoram.',
  },
  {
    key: 'Alternada',
    color: 'var(--color-alternating, #f56c9e)',
    text: 'Mudar o foco de uma coisa para outra com agilidade. Entra em ação quando você alterna entre e-mails e uma reunião.',
  },
  {
    key: 'Dividida',
    color: 'var(--color-divided, #a76cf5)',
    text: 'Gerenciar duas ou mais coisas ao mesmo tempo. É o que você usa quando dirige e conversa, ou cozinha acompanhando uma receita.',
  },
];

const ATTENTION_COLORS: Record<string, string> = {
  'Seletiva': 'var(--color-selective)',
  'Sustentada': 'var(--color-sustained)',
  'Alternada': 'var(--color-alternating)',
  'Dividida': 'var(--color-divided)',
};

export function OnboardingRadarIntro({ baseline, onAdvance }: Props) {
  const navigate = useNavigate();

  const scores = {
    'Seletiva':  baseline.seletiva?.score ?? 0,
    'Sustentada': baseline.sustentada?.score ?? 0,
    'Alternada': baseline.alternada?.score ?? 0,
    'Dividida':  baseline.dividida?.score ?? 0,
  };

  const entries = Object.entries(scores) as [string, number][];
  const highest = entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
  const lowest  = entries.reduce((a, b) => b[1] < a[1] ? b : a)[0];

  return (
    <div style={{
      maxWidth: 600, margin: '0 auto',
      padding: 'var(--space-8) var(--space-4)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-6)',
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgb(255, 255, 255)',
          borderRadius: 99,
          padding: '10px 22px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
          fontSize: 'var(--text-sm)',
        }}
      >
        ← Voltar
      </button>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
          Seu mapa de atenção
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          Cada eixo representa um tipo de atenção. O polígono mostra onde você está agora — e tudo é questão de treino.
        </p>
      </motion.div>

      {/* Radar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <OnboardingRadar scores={scores} onComplete={onAdvance} />
      </motion.div>

      {/* Linha dinâmica */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          textAlign: 'center', fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        ⭐ Seu ponto forte: <strong style={{ color: ATTENTION_COLORS[highest] }}>{highest}</strong>
        {'  ·  '}
        🎯 Foco do treino: <strong style={{ color: ATTENTION_COLORS[lowest] }}>{lowest}</strong>
      </motion.div>

      {/* Textos das 4 atenções */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {ATTENTION_TEXTS.map((a, i) => (
          <motion.div
            key={a.key}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            style={{
              display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${a.color}`,
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 2, color: a.color }}>
                {a.key}
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {a.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <p style={{
        fontSize: 'var(--text-xs)', color: 'rgb(232, 233, 240)',
        textAlign: 'center', lineHeight: 1.6,
      }}>
        Estas descrições são baseadas em literatura científica sobre atenção e têm caráter informativo.
        Não representam avaliação clínica ou diagnóstico.
      </p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onAdvance}
        style={{
          padding: '14px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: 'white',
          fontSize: 'var(--text-base)', fontWeight: 600,
          border: 'none', cursor: 'pointer', width: '100%',
        }}
      >
        Entender meu resultado →
      </motion.button>
    </div>
  );
}
