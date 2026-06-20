import { COLORS, SHAPES, COLOR_KEYS, SHAPE_KEYS, MIN_BLOCK_SIZE, MAX_BLOCK_SIZE } from './constants';
import type { RuleType, TrialType, TrialConfig, ColorName, ShapeType } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

function makeTrial(
  rule: RuleType,
  trialType: TrialType,
  trialIndex: number,
  prev: TrialConfig | null,
): TrialConfig {
  const shape = pick(SHAPES) as ShapeType;
  const color = pick(COLORS) as ColorName;
  const isBivalent =
    trialType === 'switch' &&
    prev !== null &&
    (prev.color === color || prev.shape === shape);
  return { trialIndex, rule, trialType, shape, color, isBivalent };
}

/** Bloco puro: todos os trials com a mesma regra fixa */
export function buildPureTrials(rule: RuleType, total: number): TrialConfig[] {
  return Array.from({ length: total }, (_, i) =>
    makeTrial(rule, 'pure', i, null)
  );
}

/** Bloco misto: regra alterna em mini-blocos de 1–3 */
export function buildMixedTrials(total: number): TrialConfig[] {
  const rules = generateRuleSequence(total);
  const configs: TrialConfig[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule     = rules[i];
    const prevRule = i === 0 ? null : rules[i - 1];
    const trialType: TrialType =
      i === 0           ? 'first'  :
      rule === prevRule ? 'repeat' : 'switch';
    configs.push(makeTrial(rule, trialType, i, configs[i - 1] ?? null));
  }
  return configs;
}

/** Mantido para compatibilidade */
export function buildPracticeTrials(): TrialConfig[] {
  return buildPureTrials('color', 4).concat(buildPureTrials('shape', 4));
}
export function buildTrials(totalTrials: number): TrialConfig[] {
  return buildMixedTrials(totalTrials);
}

export function isCorrect(trial: TrialConfig, key: string): boolean {
  const k = key.toLowerCase();
  if (trial.rule === 'color') return COLOR_KEYS[trial.color] === k;
  if (trial.rule === 'shape') return SHAPE_KEYS[trial.shape] === k;
  return false;
}

export function isPerseveration(
  trial: TrialConfig,
  key: string,
  prevRule: RuleType | null,
): boolean {
  if (trial.trialType !== 'switch') return false;
  if (prevRule === null) return false;
  const k = key.toLowerCase();
  if (prevRule === 'color') return COLOR_KEYS[trial.color] === k;
  if (prevRule === 'shape') return SHAPE_KEYS[trial.shape] === k;
  return false;
}

export function allValidKeys(): string[] {
  return [...Object.values(COLOR_KEYS), ...Object.values(SHAPE_KEYS)]
    .filter((v, i, a) => a.indexOf(v) === i);
}
