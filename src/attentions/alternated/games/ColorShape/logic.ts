import { COLORS, SHAPES, COLOR_KEYS, SHAPE_KEYS, MIN_BLOCK_SIZE, MAX_BLOCK_SIZE } from './constants';
import type { RuleType, TrialType, TrialConfig, ColorName, ShapeType } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Gera sequência de regras com blocos pseudoaleatórios de 1-3 trials */
export function generateRuleSequence(totalTrials: number): RuleType[] {
  const seq: RuleType[] = [];
  let currentRule: RuleType = Math.random() < 0.5 ? 'color' : 'shape';
  while (seq.length < totalTrials) {
    const blockSize = randInt(MIN_BLOCK_SIZE, MAX_BLOCK_SIZE);
    for (let i = 0; i < blockSize && seq.length < totalTrials; i++) {
      seq.push(currentRule);
    }
    currentRule = currentRule === 'color' ? 'shape' : 'color';
  }
  return seq;
}

/** Monta array de TrialConfig a partir da sequência de regras */
export function buildTrials(totalTrials: number): TrialConfig[] {
  const rules = generateRuleSequence(totalTrials);
  return rules.map((rule, i) => {
    const prevRule = i === 0 ? null : rules[i - 1];
    const trialType: TrialType =
      i === 0            ? 'first'  :
      rule === prevRule  ? 'repeat' : 'switch';
    return {
      trialIndex: i,
      rule,
      trialType,
      shape: pick(SHAPES) as ShapeType,
      color: pick(COLORS) as ColorName,
    };
  });
}

/** Verifica se a tecla pressionada é a correta para o trial */
export function isCorrect(trial: TrialConfig, key: string): boolean {
  const k = key.toLowerCase();
  if (trial.rule === 'color')  return COLOR_KEYS[trial.color]  === k;
  if (trial.rule === 'shape')  return SHAPE_KEYS[trial.shape]  === k;
  return false;
}

/** Retorna todas as teclas válidas */
export function allValidKeys(): string[] {
  return [
    ...Object.values(COLOR_KEYS),
    ...Object.values(SHAPE_KEYS),
  ].filter((v, i, a) => a.indexOf(v) === i);
}
