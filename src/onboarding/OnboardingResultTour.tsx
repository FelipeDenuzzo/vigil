import { motion } from 'framer-motion';
import type { OnboardingReport } from '../lib/evaluatorClient';
import { useNavigate } from 'react-router-dom';

interface Props {
  report: OnboardingReport;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  onStart: () => void; // chama refreshAccess + navigate
}

export function OnboardingResultTour({ report, saving, saved, saveError, onStart }: Props) {
  const { mensagem_ux } = report;
  const navigate = useNavigate();

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
          {mensagem_ux.titulo}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          {mensagem_ux.paragrafo_boas_vindas}
        </p>
      </motion.div>

      {/* Label de contexto */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)',
          textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center',
        }}
      >
        É assim que seus resultados aparecerão após cada treino
      </motion.p>

      {/* Card Superpoder */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          borderLeft: '4px solid var(--color-sustained)',
        }}
      >
        <h3 style={{
          fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)',
          color: 'var(--color-sustained)', textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          ⚡ Seu Superpoder
        </h3>
        <p style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          {mensagem_ux.superpoder}
        </p>
      </motion.div>

      {/* Card Foco de Treino */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          borderLeft: '4px solid var(--color-alternating)',
        }}
      >
        <h3 style={{
          fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)',
          color: 'var(--color-alternating)', textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          🎯 Foco de Treino
        </h3>
        <p style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          {mensagem_ux.foco_de_treino}
        </p>
      </motion.div>

      {/* Nota sobre a área */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          padding: 'var(--space-4)',
          background: 'rgba(108,142,245,0.07)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(108,142,245,0.2)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
          textAlign: 'center',
        }}
      >
        Após cada treino você verá esses cards atualizados com sua evolução, junto com a teia mostrando seu progresso ao longo do tempo.
      </motion.div>

      {saveError && (
        <p style={{ color: 'var(--color-error, #f08080)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
          {saveError}
        </p>
      )}

      {/* Botão final */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        onClick={onStart}
        disabled={saving || !saved}
        style={{
          padding: '14px', borderRadius: 'var(--radius-md)',
          background: saving || !saved ? 'var(--color-surface-offset)' : 'var(--color-primary)',
          color: saving || !saved ? 'var(--color-text-faint)' : 'white',
          fontSize: 'var(--text-base)', fontWeight: 600,
          border: 'none',
          cursor: saving || !saved ? 'not-allowed' : 'pointer',
          width: '100%', transition: 'var(--transition)',
        }}
      >
        {saving ? 'Finalizando...' : !saved ? 'Aguarde...' : 'Começar a Treinar →'}
      </motion.button>
    </div>
  );
}
