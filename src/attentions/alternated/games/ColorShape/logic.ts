import { COLORS, SHAPES, COLOR_KEYS, SHAPE_KEYS, MIN_BLOCK_SIZE, MAX_BLOCK_SIZE } from './constants';
import type { RuleType, TrialType, TrialConfig, ColorName, ShapeType } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Gera sequência de regras com blocos pseudoaleatórios de 1-3 */
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

/** Constrói um TrialConfig a partir de regra, índice e trial anterior */
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

/**
 * buildPracticeTrials — 4 puros (2 cor + 2 forma) + 8 mistos, embaralhados.
 *
 * Os 4 puros são inseridos em posições aleatórias dentro da sequência de 12,
 * garantindo que nunca fiquem todos juntos no início ou fim.
 * Os trials puros têm trialType='pure' e não geram switching cost.
 */
export function buildPracticeTrials(): TrialConfig[] {
  // 4 slots puros: 2 cor, 2 forma — ordem aleatória
  const pureRules = shuffle<RuleType>(['color', 'color', 'shape', 'shape']);
  const pureSlots = new Set<number>();

  // Escolhe 4 posições não-consecutivas dentro de 0-11
  const positions = shuffle([0,1,2,3,4,5,6,7,8,9,10,11]).slice(0, 4).sort((a,b)=>a-b);
  positions.forEach(p => pureSlots.add(p));

  // Gera 8 mistos
  const mixedRules = generateRuleSequence(8);

  const all: TrialConfig[] = [];
  let pureIdx = 0;
  let mixedIdx = 0;

  for (let i = 0; i < 12; i++) {
    const prev = all[i - 1] ?? null;
    if (pureSlots.has(i)) {
      const rule = pureRules[pureIdx++];
      all.push(makeTrial(rule, 'pure', i, prev));
    } else {
      const rule = mixedRules[mixedIdx];
      const prevMixedRule = mixedIdx === 0 ? null : mixedRules[mixedIdx - 1];
      // trialType em relação ao trial misto anterior (ignora puros na contagem de switch)
      const lastMixedRule = all.filter(t => t.trialType !== 'pure').slice(-1)[0]?.rule ?? null;
      const trialType: TrialType =
        lastMixedRule === null ? 'first' :
        rule === lastMixedRule ? 'repeat' : 'switch';
      all.push(makeTrial(rule, trialType, i, prev));
      mixedIdx++;
    }
  }

  return all;
}

/** Trials para a fase principal — apenas mistos com switching */
export function buildTrials(totalTrials: number): TrialConfig[] {
  const rules = generateRuleSequence(totalTrials);
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

/** Verifica se a tecla é correta para o trial */
export function isCorrect(trial: TrialConfig, key: string): boolean {
  const k = key.toLowerCase();
  if (trial.rule === 'color') return COLOR_KEYS[trial.color] === k;
  if (trial.rule === 'shape') return SHAPE_KEYS[trial.shape] === k;
  return false;
}

/**
 * Perseveração: switch trial + resposta errada + tecla correta para regra anterior.
 */
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

/** Retorna todas as teclas válidas */
export function allValidKeys(): string[] {
  return [...Object.values(COLOR_KEYS), ...Object.values(SHAPE_KEYS)]
    .filter((v, i, a) => a.indexOf(v) === i);
}
