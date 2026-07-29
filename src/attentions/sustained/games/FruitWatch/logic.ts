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
      const launchX = rand(15, 85);
      // Trajetória em parábola: se lança de um lado, curva-se para o outro
      const offset = rand(15, 30);
      const endX = launchX < 50 ? Math.min(95, launchX + offset) : Math.max(5, launchX - offset);
      const peakY = rand(65, 85);

      figures.push({
        id: uuid(),
        figureId: fig.id,
        isTarget: fig.id === target.id,
        launchX,
        endX,
        peakY,
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

  const getAcc = (p: PhaseRawResult) => getPartialAccuracy(p.targetCount, p.userAnswer);

  // Média de Acurácia das Fases 1 e 2
  const acc1 = getAcc(byPhase(1));
  const acc2 = getAcc(byPhase(2));
  const avg12 = (acc1 + acc2) / 2;

  // Média de Acurácia das Fases 5 e 6
  const acc5 = getAcc(byPhase(5));
  const acc6 = getAcc(byPhase(6));
  const avg56 = (acc5 + acc6) / 2;

  // Custo de Dupla-Tarefa (DTC)
  const dtc = Math.max(0, avg12 - avg56);

  // Fórmula da Matriz (Nota de 0 a 100)
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const finalScore = Math.round(clamp(avg12 - (dtc / 40) * 100, 0, 100));

  // Como finalScore agora é o balizador (antes era o focoContinuo), mantemos a variável para compatibilidade
  const focoContinuo = finalScore;
  
  // Mantemos as outras métricas baseadas na acurácia parcial para o laudo
  const controleCalma = Math.round((getAcc(byPhase(3)) + getAcc(byPhase(4))) / 2);
  const focoMultitarefa = Math.round(avg56);

  // 4. Conquista secreta — Se o usuário acertou a contagem bônus na Fase 5
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

export function getPartialAccuracy(targetCount: number, userAnswer: number): number {
  if (targetCount === 0 && userAnswer === 0) return 100;
  const diff = userAnswer - targetCount;
  
  if (diff === 0) return 100;
  if (diff === -1) return 80;
  if (diff === 1) return 70;
  if (diff === -2) return 50;
  if (diff === 2) return 40;
  
  return 0;
}
