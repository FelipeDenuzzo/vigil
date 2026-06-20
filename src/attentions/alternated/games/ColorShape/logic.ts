import { COLORS, SHAPES, COLOR_KEYS, SHAPE_KEYS, MIN_BLOCK_SIZE, MAX_BLOCK_SIZE } from './constants';
import type { RuleType, TrialType, TrialConfig, ColorName, ShapeType, TrialResult } from './types';

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

/**
 * Detecta se um trial é bivalente:
 * a tecla CORRETA para a regra ATUAL coincide com uma tecla válida da regra OPOSTA.
 * Ex: regra=color, color=red (tecla J) e shape=circle (tecla A) — não bivalente.
 * Bivalente seria se, por acaso, a cor-certa e a forma-certa usassem a mesma tecla
 * (não ocorre com o mapeamento atual) — aqui usamos a definição extensa:
 * o estímulo possui AMBAS as características salientes quando a outra regra era ativa.
 * Simplificação prática: um trial é bivalente se o trial anterior tinha regra diferente
 * E o estímulo atual compartilha a cor ou forma com o estímulo anterior.
 */
export function buildTrials(totalTrials: number): TrialConfig[] {
  const rules = generateRuleSequence(totalTrials);
  const configs: TrialConfig[] = [];

  for (let i = 0; i < rules.length; i++) {
    const rule     = rules[i];
    const prevRule = i === 0 ? null : rules[i - 1];
    const trialType: TrialType =
      i === 0           ? 'first'  :
      rule === prevRule ? 'repeat' : 'switch';

    const shape = pick(SHAPES) as ShapeType;
    const color = pick(COLORS) as ColorName;
    const prev  = configs[i - 1];

    // Trial bivalente: troca de regra E o estímulo tem mesma cor OU mesma forma que o anterior
    const isBivalent =
      trialType === 'switch' &&
      prev != null &&
      (prev.color === color || prev.shape === shape);

    configs.push({ trialIndex: i, rule, trialType, shape, color, isBivalent });
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
 * Detecta perseveração: trial é switch, resposta errada E
 * a tecla pressionada é a resposta CORRETA para a regra ANTERIOR.
 */
export function isPerseveration(trial: TrialConfig, key: string, prevRule: RuleType | null): boolean {
  if (trial.trialType !== 'switch') return false;
  if (prevRule === null) return false;
  const k = key.toLowerCase();
  // Resposta correta para regra anterior
  if (prevRule === 'color') return COLOR_KEYS[trial.color] === k;
  if (prevRule === 'shape') return SHAPE_KEYS[trial.shape] === k;
  return false;
}

/** Retorna todas as teclas válidas */
export function allValidKeys(): string[] {
  return [...Object.values(COLOR_KEYS), ...Object.values(SHAPE_KEYS)]
    .filter((v, i, a) => a.indexOf(v) === i);
}
