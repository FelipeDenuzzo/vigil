import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { useOnboardingState } from './useOnboardingState';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingRound } from './OnboardingRound';
import { OnboardingResult } from './OnboardingResult';

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const {
    state,
    goTo,
    submitMotor,
    submitInhibitory,
    submitFlexible,
    saveBaseline,
    saving,
    saveError,
  } = useOnboardingState(user!.uid);

  const { currentStep, baseline } = state;

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      {/* Barra de progresso */}
      {currentStep !== 'welcome' && currentStep !== 'result' && (
        <div style={{ maxWidth: 600, margin: '0 auto var(--space-6)', height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            background: 'var(--color-selective)',
            width: currentStep === 'round-motor' ? '33%' : currentStep === 'round-inhibitory' ? '66%' : '100%',
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {currentStep === 'welcome' && (
        <OnboardingWelcome onStart={() => goTo('round-motor')} />
      )}

      {currentStep === 'round-motor' && (
        <OnboardingRound roundType="motor" onMotorDone={submitMotor} />
      )}

      {currentStep === 'round-inhibitory' && (
        <OnboardingRound roundType="inhibitory" onInhibitoryDone={submitInhibitory} />
      )}

      {currentStep === 'round-flexible' && (
        <OnboardingRound roundType="flexible" onFlexibleDone={submitFlexible} />
      )}

      {currentStep === 'result' && baseline && (
        <OnboardingResult
          state={state}
          onSave={saveBaseline}
          saving={saving}
          saveError={saveError}
        />
      )}
    </div>
  );
};
