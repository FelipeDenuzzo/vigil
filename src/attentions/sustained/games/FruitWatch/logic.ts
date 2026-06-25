// src/attentions/sustained/games/FruitWatch/logic.ts

import { v4 as uuid } from 'uuid';
import type {
  FlyingFigure, PhaseConfig, PhaseRawResult, FruitWatchScore, FigureDefinition
} from './types';

// Gera a sequência de figuras para uma fase com base nos parâmetros de velocidade e intervalo
export function generateFigureSequence(
  config: PhaseConfig,
  target: FigureDefinition,
  distractors: FigureDefinition[],
  bonusFigure?: FigureDefinition
): FlyingFigure[] {
  const figures: FlyingFigure[] = [];
  const pool: FigureDefinition[] = [target, ...distractors];
  if (bonusFigure) {
    // Adiciona o bônus na piscina de sorteio para que ele apareça de fato nas fases 5 e 6
    pool.push(bonusFigure);
  }

  let t = 1000; // Começa 1 segundo após o início para dar tempo do usuário se preparar
  const endTime = config.durationMs - 2000; // Evita lançar nos últimos 2s para que todas completem o voo

  while (t < endTime) {
    const flightDuration = rand(config.flightDurationMs[0], config.flightDurationMs[1]);
    const count = config.simultaneousFigures;

    for (let i = 0; i < count; i++) {
      const fig = pool[Math.floor(Math.random() * pool.length)];
      figures.push({
        id: uuid(),
        figureId: fig.id,
        isTarget: fig.id === target.id,
        launchX: rand(15, 85),
        launchAt: t + i * 150, // Offset um pouco maior para evitar sobreposição total na subida
        flightDurationMs: flightDuration,
      });
    }
    // Incrementa pelo intervalo randômico configurado
    t += rand(config.interItemIntervalMs[0], config.interItemIntervalMs[1]);
  }

  return figures;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Conta o total real de vezes que o alvo e o bônus apareceram na rodada
export function countFiguresInSequence(
  sequence: FlyingFigure[],
  targetId: string,
  bonusId?: string
): { targetCount: number; bonusCount: number } {
  return {
    targetCount: sequence.filter(f => f.figureId === targetId).length,
    bonusCount: bonusId ? sequence.filter(f => f.figureId === bonusId).length : 0,
  };
}

// Calcula os scores cognitivos deterministicamente no frontend
export function calculateFruitWatchScore(results: PhaseRawResult[]): FruitWatchScore {
  const byPhase = (p: number) => results.find(r => r.phase === p)!;

  // 1. Foco Contínuo — Omissões (subcontagem) nas fases fáceis (1 e 2)
  const focoContinuo = calcOmissionScore([byPhase(1), byPhase(2)]);

  // 2. Controle e Calma — Falsos positivos (supercontagem) nas fases de alta semelhança (3 e 4) + toques de comissão
  const controleCalma = calcControlScore([byPhase(3), byPhase(4)]);

  // 3. Foco Multitarefa — Custo de Dupla Tarefa (DTC) entre a fase 5 e fase 6
  // Fase 5: pergunta bônus vem depois (memória de trabalho exigida no final)
  // Fase 6: pergunta bônus vem antes (interferência imediata)
  const prec5 = precisionOf(byPhase(5));
  const prec6 = precisionOf(byPhase(6));
  const dtc = prec5 > 0 ? Math.abs(prec5 - prec6) / prec5 : 0;
  const focoMultitarefa = Math.max(0, Math.round(100 - dtc * 100));

  // 4. Conquista secreta — Se o usuário acertou a contagem bônus na Fase 5 (atenção periférica)
  const r5 = byPhase(5);
  const conquistaSecreta =
    r5.bonusUserAnswer !== undefined &&
    r5.bonusRealCount !== undefined &&
    r5.bonusRealCount > 0 &&
    r5.bonusUserAnswer === r5.bonusRealCount;

  return {
    focoContinuo,
    controleCalma,
    focoMultitarefa,
    conquistaSecreta,
    rawResults: results,
  };
}

function precisionOf(r: PhaseRawResult): number {
  if (r.targetCount === 0) return 1;
  const diff = Math.abs(r.userAnswer - r.targetCount);
  return Math.max(0, 1 - diff / r.targetCount);
}

function calcOmissionScore(phases: PhaseRawResult[]): number {
  let totalOmissions = 0;
  let totalTargets = 0;
  for (const p of phases) {
    // Subcontagem = omissões
    const omission = Math.max(0, p.targetCount - p.userAnswer);
    totalOmissions += omission;
    totalTargets += p.targetCount;
    // Comissões motoras (cliques extras) também penalizam levemente a estabilidade atencional
    totalOmissions += p.commissionErrors * 0.5;
  }
  if (totalTargets === 0) return 100;
  const rate = totalOmissions / totalTargets;
  return Math.max(0, Math.round(100 - rate * 120)); // Fator de escala 1.2
}

function calcControlScore(phases: PhaseRawResult[]): number {
  let totalFalsePos = 0;
  let totalTargets = 0;
  let totalCommission = 0;
  for (const p of phases) {
    // Supercontagem = falsos positivos (impulsividade de contar distratores semelhantes)
    const falsePos = Math.max(0, p.userAnswer - p.targetCount);
    totalFalsePos += falsePos;
    totalTargets += p.targetCount;
    totalCommission += p.commissionErrors;
  }
  if (totalTargets === 0) return 100;
  const fpRate = totalFalsePos / totalTargets;
  const commissionPenalty = Math.min(totalCommission * 3, 30); // Limita penalidade direta de cliques a 30 pontos
  return Math.max(0, Math.round(100 - fpRate * 100 - commissionPenalty));
}
