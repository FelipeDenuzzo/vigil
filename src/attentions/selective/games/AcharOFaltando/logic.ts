import {
  MissingItemConfig,
  MissingItemDifference,
  MissingItemRound,
  MissingItemRoundResponse,
  MissingItemRoundResult,
  MissingItemSessionMetrics,
  MissingItemType,
} from './types';

const DEFAULT_SYMBOLS = Array.from({ length: 28 }, (_, i) => String(18 + i));

export function createSeededRng(seed: string): () => number {
  if (!seed.trim()) return Math.random;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleOne<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

function sampleMany<T>(items: T[], count: number, rng: () => number): T[] {
  return shuffle(items, rng).slice(0, Math.max(1, Math.min(items.length, count)));
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

export function getItemPool(itemType: MissingItemType): string[] {
  if (itemType === 'numbers') return ['0','1','2','3','4','5','6','7','8','9'];
  if (itemType === 'letters') return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  return DEFAULT_SYMBOLS;
}



export function generateRound(
  config: MissingItemConfig,
  roundNumber: number,
): MissingItemRound {
  const rng = createSeededRng(`${config.seed || 'auto'}-${roundNumber}`);
  const totalCells = config.gridSize * config.gridSize;
  const phase = ((roundNumber - 1) % 10) + 1;

  let itemsA: string[] = [];
  let itemsB: string[] = [];
  let differences: MissingItemDifference[] = [];
  let options: string[] = [];

  const symbolsPool = Array.from({ length: 28 }, (_, i) => String(18 + i)); // '18' to '45'
  const lettersPool = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // 'A' to 'Z'
  const digitsPool = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  if (phase === 1 || phase === 2) {
    // 1 e 2 - usaremos os simbolos como está hoje, mas sem usar o faltando, sempre com um diferente
    const basePool = sampleMany(symbolsPool, 8, rng);
    itemsA = Array.from({ length: totalCells }, () => sampleOne(basePool, rng));
    itemsB = [...itemsA];

    const targetIndex = Math.floor(rng() * totalCells);
    const original = itemsA[targetIndex]!;
    const remainingSymbols = symbolsPool.filter(s => s !== original);
    const replacement = sampleOne(remainingSymbols, rng);

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    const filler = shuffle(symbolsPool.filter(s => s !== replacement && s !== original), rng).slice(0, 3);
    options = shuffle([replacement, ...filler], rng);

  } else if (phase === 3) {
    // 3 - usaremos triangulo e circulos, os arquivos 29.png e 25.png
    const pair = ['29', '25'];
    itemsA = Array.from({ length: totalCells }, () => sampleOne(pair, rng));
    itemsB = [...itemsA];

    const targetIndex = Math.floor(rng() * totalCells);
    const original = itemsA[targetIndex]!;
    const replacement = original === '29' ? '25' : '29';

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    options = shuffle([...pair], rng);

  } else if (phase === 4) {
    // 4 - Varios Q e O - com mais Q que O
    itemsA = Array.from({ length: totalCells }, () => (rng() < 0.75 ? 'Q' : 'O'));
    itemsB = [...itemsA];

    const targetIndex = Math.floor(rng() * totalCells);
    const original = itemsA[targetIndex]!;
    const replacement = original === 'Q' ? 'O' : 'Q';

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    options = shuffle(['Q', 'O'], rng);

  } else if (phase === 5) {
    // 5 - Varios O e Q com mais O que Q
    itemsA = Array.from({ length: totalCells }, () => (rng() < 0.75 ? 'O' : 'Q'));
    itemsB = [...itemsA];

    const targetIndex = Math.floor(rng() * totalCells);
    const original = itemsA[targetIndex]!;
    const replacement = original === 'O' ? 'Q' : 'O';

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    options = shuffle(['O', 'Q'], rng);

  } else if (phase === 6) {
    // 6 - Varias letras maiusculas, mas as diferenças sempre emtre O e Q, que tambem devem estar presentes em 50%
    const distractorLetters = lettersPool.filter(l => l !== 'O' && l !== 'Q');
    
    const positions = Array.from({ length: totalCells }, (_, i) => i);
    const shuffledPositions = shuffle(positions, rng);
    const oqCount = Math.floor(totalCells / 2);
    const oqPositions = new Set(shuffledPositions.slice(0, oqCount));

    itemsA = Array.from({ length: totalCells }, (_, idx) => {
      if (oqPositions.has(idx)) {
        return rng() < 0.5 ? 'O' : 'Q';
      } else {
        return sampleOne(distractorLetters, rng);
      }
    });
    itemsB = [...itemsA];

    const oqList = Array.from(oqPositions);
    const targetIndex = sampleOne(oqList, rng);
    const original = itemsA[targetIndex]!;
    const replacement = original === 'O' ? 'Q' : 'O';

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    options = shuffle(['O', 'Q'], rng);

  } else if (phase === 7) {
    // 7 - mistura de 2 e 7
    const pair = ['2', '7'];
    itemsA = Array.from({ length: totalCells }, () => sampleOne(pair, rng));
    itemsB = [...itemsA];

    const targetIndex = Math.floor(rng() * totalCells);
    const original = itemsA[targetIndex]!;
    const replacement = original === '2' ? '7' : '2';

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    options = shuffle([...pair], rng);

  } else if (phase === 8) {
    // 8 - mistura outros numeros de unidade e 2 e 7, sendo que a diferença sempre está ou em um 2 ou em um 7
    const otherDigits = digitsPool.filter(d => d !== '2' && d !== '7');
    
    const positions = Array.from({ length: totalCells }, (_, i) => i);
    const shuffledPositions = shuffle(positions, rng);
    const targetCount = Math.floor(totalCells / 2);
    const targetPositions = new Set(shuffledPositions.slice(0, targetCount));

    itemsA = Array.from({ length: totalCells }, (_, idx) => {
      if (targetPositions.has(idx)) {
        return rng() < 0.5 ? '2' : '7';
      } else {
        return sampleOne(otherDigits, rng);
      }
    });
    itemsB = [...itemsA];

    const targetList = Array.from(targetPositions);
    const targetIndex = sampleOne(targetList, rng);
    const original = itemsA[targetIndex]!;
    const replacement = original === '2' ? '7' : '2';

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    options = shuffle(['2', '7'], rng);

  } else if (phase === 9) {
    // 9 - misturar somente d e p minusculos
    const pair = ['d', 'p'];
    itemsA = Array.from({ length: totalCells }, () => sampleOne(pair, rng));
    itemsB = [...itemsA];

    const targetIndex = Math.floor(rng() * totalCells);
    const original = itemsA[targetIndex]!;
    const replacement = original === 'd' ? 'p' : 'd';

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    options = shuffle([...pair], rng);

  } else if (phase === 10) {
    // 10 - misturar um pouco de todos
    const lowercasePool = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));
    
    itemsA = Array.from({ length: totalCells }, () => {
      const rand = rng();
      if (rand < 0.25) {
        return sampleOne(symbolsPool, rng);
      } else if (rand < 0.5) {
        return sampleOne(lettersPool, rng);
      } else if (rand < 0.75) {
        return sampleOne(lowercasePool, rng);
      } else {
        return sampleOne(digitsPool, rng);
      }
    });
    itemsB = [...itemsA];

    const targetIndex = Math.floor(rng() * totalCells);
    const original = itemsA[targetIndex]!;
    
    const allCombined = [...symbolsPool, ...lettersPool, ...lowercasePool, ...digitsPool];
    const remainingCombined = allCombined.filter(x => x !== original);
    const replacement = sampleOne(remainingCombined, rng);

    itemsB[targetIndex] = replacement;
    differences.push({
      index: targetIndex,
      kind: 'extra',
      expectedItem: replacement,
      originalItem: original,
    });

    const filler = shuffle(allCombined.filter(x => x !== replacement && x !== original), rng).slice(0, 3);
    options = shuffle([replacement, ...filler], rng);
  }

  return {
    roundNumber,
    gridSize: config.gridSize,
    columns: config.layoutMode === 'list' ? 1 : config.gridSize,
    itemsA,
    itemsB,
    differences,
    options,
  };
}

export function evaluateRound(
  round: MissingItemRound,
  response: MissingItemRoundResponse,
  responseMode: MissingItemConfig['responseMode'],
): Pick<MissingItemRoundResult, 'hits' | 'omissions' | 'falsePositives' | 'correct' | 'response'> {
  const expectedIndexes = round.differences.map(d => d.index);

  if (responseMode === 'click-difference') {
    const selected = new Set(
      response.markedCells && response.markedCells.length > 0
        ? response.markedCells.map(c => `${c.board}:${c.index}`)
        : response.markedIndexes.map(i => `B:${i}`),
    );
    const expected = new Set(expectedIndexes);
    let hits = 0;
    expected.forEach(i => { if (selected.has(`A:${i}`) || selected.has(`B:${i}`)) hits++; });
    let falsePositives = 0;
    selected.forEach(key => {
      const parts = key.split(':');
      const parsed = Number(parts[1]);
      if (!Number.isFinite(parsed) || !expected.has(parsed)) falsePositives++;
    });
    const omissions = expected.size - hits;
    return {
      hits, omissions, falsePositives,
      correct: omissions === 0 && falsePositives === 0,
      response: response.markedCells && response.markedCells.length > 0
        ? response.markedCells.map(c => `${c.board}:${c.index}`).join('|')
        : response.markedIndexes.join('|') || '(vazio)',
    };
  }

  const expectedItems = round.differences.map(d => d.expectedItem);
  const selectedItems = Array.from(new Set(response.selectedItems));
  let hits = 0;
  expectedItems.forEach(v => { if (selectedItems.includes(v)) hits++; });
  const omissions = Math.max(0, expectedItems.length - hits);
  const falsePositives = selectedItems.filter(v => !expectedItems.includes(v)).length;
  return {
    hits, omissions, falsePositives,
    correct: omissions === 0 && falsePositives === 0,
    response: selectedItems.join('|') || '(vazio)',
  };
}

function detectItemType(items: string[]): MissingItemType {
  const isSymbol = (x: string) => /^\d+$/.test(x) && Number(x) >= 18 && Number(x) <= 45;
  const isNumber = (x: string) => /^\d+$/.test(x) && !isSymbol(x);

  const nonOpt = items.filter(x => x !== '');
  if (nonOpt.every(isSymbol)) return 'symbols';
  if (nonOpt.every(isNumber)) return 'numbers';
  return 'letters';
}

export function buildRoundResult(params: {
  config: MissingItemConfig;
  round: MissingItemRound;
  response: MissingItemRoundResponse;
  nowIso?: string;
}): MissingItemRoundResult {
  const { config, round, response, nowIso } = params;
  const evaluated = evaluateRound(round, response, config.responseMode);
  return {
    roundNumber: round.roundNumber,
    timestampIso: nowIso ?? new Date().toISOString(),
    gridSize: round.gridSize,
    presentationMode: config.presentationMode,
    layoutMode: config.layoutMode,
    itemType: detectItemType(round.itemsA),
    differenceMode: (round.differences[0]?.kind as any) || config.differenceMode,
    responseMode: config.responseMode,
    differenceCount: config.differenceCount,
    targetItems: round.differences.map(d => d.expectedItem),
    differencePositions: round.differences.map(d => d.index),
    response: evaluated.response,
    correct: evaluated.correct,
    hits: evaluated.hits,
    omissions: evaluated.omissions,
    falsePositives: evaluated.falsePositives,
    responseTimeMs: response.responseTimeMs,
  };
}

export function computeMetrics(
  results: MissingItemRoundResult[],
  elapsedSec: number,
): MissingItemSessionMetrics {
  const roundsPlayed = results.length;
  const totalHits = results.reduce((s, r) => s + r.hits, 0);
  const totalOmissions = results.reduce((s, r) => s + r.omissions, 0);
  const totalFalsePositives = results.reduce((s, r) => s + r.falsePositives, 0);
  const totalCorrectRounds = results.filter(r => r.correct).length;
  const minutes = Math.max(elapsedSec / 60, 1 / 60);
  const accuracyPerMinute = totalHits / minutes;
  const averageResponseMs =
    roundsPlayed > 0
      ? results.reduce((s, r) => s + r.responseTimeMs, 0) / roundsPlayed
      : 0;
  return {
    roundsPlayed,
    totalHits,
    totalOmissions,
    totalFalsePositives,
    totalCorrectRounds,
    accuracyPerMinute,
    averageResponseMs,
    roundCurve: results.map(r => ({
      roundNumber: r.roundNumber,
      hits: r.hits,
      omissions: r.omissions,
      falsePositives: r.falsePositives,
      responseTimeMs: r.responseTimeMs,
    })),
  };
}

export function exportCSV(results: MissingItemRoundResult[]): string {
  const escape = (v: string) => `"${v.split('"').join('""')}"`;
  const header = [
    'timestamp','round','size','presentationMode','layoutMode','itemType',
    'differenceType','responseMode','targetItem','differencePositions',
    'response','correct','hits','omissions','falsePositives','responseTimeMs',
  ];
  const rows = results.map(r =>
    [
      r.timestampIso, String(r.roundNumber), String(r.gridSize),
      r.presentationMode, r.layoutMode, r.itemType, r.differenceMode,
      r.responseMode, r.targetItems.join('|'), r.differencePositions.join('|'),
      r.response, String(r.correct), String(r.hits),
      String(r.omissions), String(r.falsePositives), String(r.responseTimeMs),
    ].map(escape).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function exportJSON(results: MissingItemRoundResult[]): string {
  return JSON.stringify(results, null, 2);
}
