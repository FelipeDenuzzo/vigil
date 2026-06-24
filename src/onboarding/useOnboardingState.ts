import { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import db from '../lib/firebase';
import {
  OnboardingState,
  OnboardingStep,
  MotorRoundResult,
  InhibitoryRoundResult,
  FlexibleRoundResult,
  DividedRoundResult,
  UserBaseline,
  BaselineEntry,
  BaselineLevel,
} from './types';

// ─── Cálculo de score e level ─────────────────────────────────────────────────
// Avaliador interno: diretrizes codificadas aqui, não no Gemini.
// Faixas baseadas em literaturas de TR simples, Go/No-Go e TMT-B.
// Responsável do produto deve revisar e ajustar os limiares com base em artigos.

function calcMotorScore(result: MotorRoundResult): BaselineEntry {
  const rts = result.reactionTimes;
  const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
  const sdrt = Math.sqrt(rts.reduce((sum, rt) => sum + (rt - mean) ** 2, 0) / rts.length);

  // Faixas provisórias (adultos, ms): revisar com literatura
  // TR médio: <250=ótimo, 250–350=normal, 350–500=leve, >500=importante
  // SDRT: <60=ótimo, 60–100=normal, 100–150=leve, >150=importante
  let score = 100;
  if (mean > 500 || sdrt > 150) score = 40;
  else if (mean > 350 || sdrt > 100) score = 60;
  else if (mean > 250 || sdrt > 60) score = 80;

  const level: BaselineLevel =
    score >= 80 ? 'minimo' : score >= 60 ? 'leve' : score >= 40 ? 'moderado' : 'importante';

  // Atenção sustentada é inferida da variabilidade (SDRT)
  // Score motor representa alerta geral → mapeia para sustentada
  return { score, level, doneAt: new Date().toISOString() };
}

function calcInhibitoryScore(result: InhibitoryRoundResult): BaselineEntry {
  const commissionRate = result.commissionErrors / result.totalNoGoStimuli;
  const omissionRate = result.omissionErrors / result.totalGoStimuli;
  const rts = result.reactionTimes;
  const meanRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 999;

  // Faixas provisórias: revisar com literatura
  // Taxa de comissão: <5%=ótimo, 5–15%=leve, 15–30%=moderado, >30%=importante
  let score = 100;
  if (commissionRate > 0.3 || omissionRate > 0.3 || meanRT > 600) score = 35;
  else if (commissionRate > 0.15 || omissionRate > 0.2 || meanRT > 450) score = 55;
  else if (commissionRate > 0.05 || omissionRate > 0.1 || meanRT > 350) score = 75;

  const level: BaselineLevel =
    score >= 75 ? 'minimo' : score >= 55 ? 'leve' : score >= 35 ? 'moderado' : 'importante';

  return { score, level, doneAt: new Date().toISOString() };
}

function calcFlexibleScore(result: FlexibleRoundResult): BaselineEntry {
  const timeSec = result.totalTimeMs / 1000;
  const errorRate = result.sequenceErrors / result.totalTargets;
  const intervals = result.intervalsBetweenClicks;
  const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 0;

  // Faixas provisórias para TMT-B simplificado: revisar com literatura
  // Tempo: <60s=ótimo, 60–90s=leve, 90–120s=moderado, >120s=importante
  let score = 100;
  if (timeSec > 120 || errorRate > 0.3 || maxInterval > 8000) score = 38;
  else if (timeSec > 90 || errorRate > 0.15 || maxInterval > 5000) score = 58;
  else if (timeSec > 60 || errorRate > 0.05 || maxInterval > 3000) score = 78;

  const level: BaselineLevel =
    score >= 78 ? 'minimo' : score >= 58 ? 'leve' : score >= 38 ? 'moderado' : 'importante';

  return { score, level, doneAt: new Date().toISOString() };
}

function calcDividedScore(result: DividedRoundResult): BaselineEntry {
  const cost = result.dualTaskCost; // Ex: 0.3 = 30% de queda

  // Faixas provisórias: revisar com literatura
  // Custo: <10%=ótimo, 10–25%=leve, 25–40%=moderado, >40%=importante
  let score = 100;
  if (cost > 0.40) score = 35;
  else if (cost > 0.25) score = 55;
  else if (cost > 0.10) score = 75;

  const level: BaselineLevel =
    score >= 75 ? 'minimo' : score >= 55 ? 'leve' : score >= 35 ? 'moderado' : 'importante';

  return { score, level, doneAt: new Date().toISOString() };
}

function buildBaseline(
  motor: MotorRoundResult,
  inhibitory: InhibitoryRoundResult,
  flexible: FlexibleRoundResult,
  divided: DividedRoundResult
): UserBaseline {
  const motorEntry = calcMotorScore(motor);
  const inhibitoryEntry = calcInhibitoryScore(inhibitory);
  const flexibleEntry = calcFlexibleScore(flexible);
  const dividedEntry = calcDividedScore(divided);

  return {
    seletiva:  inhibitoryEntry,
    sustentada: motorEntry,
    alternada: flexibleEntry,
    dividida: dividedEntry,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const INITIAL_STATE: OnboardingState = {
  currentStep: 'welcome',
  motorResult: null,
  inhibitoryResult: null,
  flexibleResult: null,
  dividedResult: null,
  baseline: null,
};

export function useOnboardingState(uid: string) {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const goTo = useCallback((step: OnboardingStep) => {
    setState((s) => ({ ...s, currentStep: step }));
  }, []);

  const submitMotor = useCallback((result: MotorRoundResult) => {
    setState((s) => ({ ...s, motorResult: result, currentStep: 'round-inhibitory' }));
  }, []);

  const submitInhibitory = useCallback((result: InhibitoryRoundResult) => {
    setState((s) => ({ ...s, inhibitoryResult: result, currentStep: 'round-flexible' }));
  }, []);

  const submitFlexible = useCallback((result: FlexibleRoundResult) => {
    setState((s) => ({ ...s, flexibleResult: result, currentStep: 'round-divided' }));
  }, []);

  const submitDivided = useCallback((result: DividedRoundResult) => {
    setState((prevState) => {
      if (!prevState.motorResult || !prevState.inhibitoryResult || !prevState.flexibleResult) return prevState;
      const baseline = buildBaseline(prevState.motorResult, prevState.inhibitoryResult, prevState.flexibleResult, result);
      return { ...prevState, dividedResult: result, baseline, currentStep: 'result' };
    });
  }, []);

  const saveBaseline = useCallback(async (baseline: UserBaseline) => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateDoc(doc(db, 'users', uid), {
        baseline,
        onboardingCompleted: true,
      });
    } catch (e) {
      setSaveError('Não foi possível salvar o resultado. Tente novamente.');
      throw e;
    } finally {
      setSaving(false);
    }
  }, [uid]);

  return { state, goTo, submitMotor, submitInhibitory, submitFlexible, submitDivided, saveBaseline, saving, saveError };
}
