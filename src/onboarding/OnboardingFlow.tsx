import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useOnboardingState } from './useOnboardingState';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingRound } from './OnboardingRound';
import { OnboardingResult } from './OnboardingResult';
import { motion } from 'framer-motion';

function TransitionOverlay({ step }: { step: number }) {
  const getSub = () => {
    switch (step) {
      case 1:
        return 'Calibragem concluída. Preparando a etapa de Controle...';
      case 2:
        return 'Controle concluído. Preparando a etapa de Flexibilidade...';
      case 3:
        return 'Flexibilidade concluída. Preparando a etapa de Dupla-Tarefa...';
      default:
        return 'Preparando a próxima etapa...';
    }
  };

  const getIcon = () => {
    return step === 2 ? '🎯' : '✅';
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(18, 19, 30, 0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: '#ffffff',
      padding: 'var(--space-6)',
      textAlign: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', maxWidth: 400 }}
      >
        <div style={{ fontSize: '4.5rem', marginBottom: 'var(--space-2)' }}>{getIcon()}</div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
          Etapa {step} concluída!
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: '#c8cad8', margin: 0, lineHeight: 1.6 }}>
          {getSub()}
        </p>

        {/* Animated Progress Bar */}
        <div style={{ width: '100%', height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 'var(--space-4)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'linear' }}
            style={{
              height: '100%',
              background: step === 1 ? 'var(--color-sustained)' : step === 2 ? 'var(--color-selective)' : 'var(--color-alternating)',
              borderRadius: 2,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const {
    state,
    goTo,
    submitMotor,
    submitInhibitory,
    submitFlexible,
    submitDivided,
    saveBaseline,
    saving,
    saveError,
  } = useOnboardingState(user!.uid);

  const [overlayStep, setOverlayStep] = useState<number | null>(null);

  const { currentStep, baseline } = state;

  const handleMotorDone = (res: any) => {
    setOverlayStep(1);
    setTimeout(() => {
      submitMotor(res);
      setOverlayStep(null);
    }, 2500);
  };

  const handleInhibitoryDone = (res: any) => {
    setOverlayStep(2);
    setTimeout(() => {
      submitInhibitory(res);
      setOverlayStep(null);
    }, 2500);
  };

  const handleFlexibleDone = (res: any) => {
    setOverlayStep(3);
    setTimeout(() => {
      submitFlexible(res);
      setOverlayStep(null);
    }, 2500);
  };

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      {/* Barra de progresso */}
      {currentStep !== 'welcome' && (
        <div style={{ maxWidth: 600, margin: '0 auto var(--space-6)', height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            background: 'var(--color-selective)',
            width: currentStep === 'round-motor' ? '25%' : currentStep === 'round-inhibitory' ? '50%' : currentStep === 'round-flexible' ? '75%' : currentStep === 'round-divided' ? '95%' : '100%',
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {overlayStep !== null ? (
        <TransitionOverlay step={overlayStep} />
      ) : (
        <>
          {currentStep === 'welcome' && (
            <OnboardingWelcome onStart={() => goTo('round-motor')} />
          )}

          {currentStep === 'round-motor' && (
            <OnboardingRound roundType="motor" onMotorDone={handleMotorDone} />
          )}

          {currentStep === 'round-inhibitory' && (
            <OnboardingRound roundType="inhibitory" onInhibitoryDone={handleInhibitoryDone} />
          )}

          {currentStep === 'round-flexible' && (
            <OnboardingRound roundType="flexible" onFlexibleDone={handleFlexibleDone} />
          )}

          {currentStep === 'round-divided' && (
            <OnboardingRound roundType="divided" onDividedDone={submitDivided} />
          )}

          {currentStep === 'result' && baseline && (
            <OnboardingResult
              state={state}
              onSave={saveBaseline}
              saving={saving}
              saveError={saveError}
            />
          )}
        </>
      )}
    </div>
  );
};

