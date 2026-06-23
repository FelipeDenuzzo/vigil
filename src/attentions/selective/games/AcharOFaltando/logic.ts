import {
  MissingItemConfig,
  MissingItemDifference,
  MissingItemRound,
  MissingItemRoundResponse,
  MissingItemRoundResult,
  MissingItemSessionMetrics,
  MissingItemType,
} from './types';

const DEFAULT_SYMBOLS = [
  '☆', '★', '○', '●', '△', '▲', '□', '■', '◇', '◆',
  '☀', '☂', '✕', '+', '◯', '◉', 'I', '1', 'O', '0',
];

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

function pickDifferenceKinds(
  config: MissingItemConfig,
  rng: () => number,
): Array<'missing' | 'extra'> {
  if (config.differenceMode === 'missing')
    return Array.from({ length: config.differenceCount }, () => 'missing' as const);
  if (config.differenceMode === 'extra')
    return Array.from({ length: config.differenceCount }, () => 'extra' as const);
  return Array.from({ length: config.differenceCount }, () =>
    rng() > 0.5 ? 'missing' : 'extra',
  ) as Array<'missing' | 'extra'>;
}

function getBasePool(pool: string[], itemType: MissingItemType, rng: () => number): string[] {
  const baseSize = itemType === 'numbers' ? 6 : 8;
  return sampleMany(pool, baseSize, rng);
}

function pickExtraItem(
  fullPool: string[],
  itemsA: string[],
  itemsB: string[],
  rng: () => number,
): string {
  const blocked = new Set([...itemsA, ...itemsB].filter(x => x !== ''));
  const candidates = fullPool.filter(x => !blocked.has(x));
  return sampleOne(candidates.length > 0 ? candidates : fullPool, rng);
}

export function generateRound(
  config: MissingItemConfig,
  roundNumber: number,
): MissingItemRound {
  const rng = createSeededRng(`${config.seed || 'auto'}-${roundNumber}`);
  const fullPool = getItemPool(config.itemType);
  const basePool = getBasePool(fullPool, config.itemType, rng);
  const totalCells = config.gridSize * config.gridSize;

  const itemsA = Array.from({ length: totalCells }, () => sampleOne(basePool, rng));
  const itemsB: string[] = [...itemsA];

  const shuffledIndexes = shuffle(
    Array.from({ length: totalCells }, (_, i) => i),
    rng,
  );

  const differenceKinds = pickDifferenceKinds(config, rng).slice(0, 1);
  const differences: MissingItemDifference[] = [];

  for (let i = 0; i < differenceKinds.length; i++) {
    const index = shuffledIndexes[i] ?? i;
    const kind = differenceKinds[i]!;
    const originalItem = itemsA[index] ?? basePool[0] ?? fullPool[0] ?? '?';

    if (kind === 'missing') {
      itemsB[index] = '';
      differences.push({ index, kind, expectedItem: originalItem, originalItem });
      continue;
    }
    const replacement = pickExtraItem(fullPool, itemsA, itemsB, rng);
    itemsB[index] = replacement;
    differences.push({ index, kind, expectedItem: replacement, originalItem });
  }

  const targetItems = differences.map(d => d.expectedItem);
  const fillerOptions = shuffle(
    fullPool.filter(x => !targetItems.includes(x)),
    rng,
  ).slice(0, 3);

  const options = shuffle(Array.from(new Set([...targetItems, ...fillerOptions])), rng);

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
      const parsed = Number(key.split(':')[1]);
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
    itemType: config.itemType,
    differenceMode: config.differenceMode,
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
  const escape = (v: string) => `"${v.replaceAll('"', '""')}"`;
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
