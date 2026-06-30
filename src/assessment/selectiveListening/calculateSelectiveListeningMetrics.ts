// src/assessment/selectiveListening/calculateSelectiveListeningMetrics.ts
import { TentativaRodada, SelectiveListeningMetrics } from './types';

export function calculateSelectiveListeningMetrics(rounds: TentativaRodada[]): SelectiveListeningMetrics {
  const totalRounds = rounds.length;
  if (totalRounds === 0) {
    return {
      totalRounds: 0,
      serialAccuracy: 0,
      itemAccuracy: 0,
      omissions: 0,
      meanResponseTimeMs: 0,
      distractorIntrusionRate: 0,
      loadCost: 0,
      avgReplayCount: 0,
      ludicScore: 0,
    };
  }

  let totalSerialAcc = 0;
  let totalItemAcc = 0;
  let omissionsCount = 0;
  let totalLatency = 0;
  let validLatencyCount = 0;
  let totalIntrusionRate = 0;
  let totalReplay = 0;

  // Listas para separar as rodadas por carga (tamanho da sequência)
  const lowLoadAcc: number[] = [];  // Carga <= 3 (nível 1 e rodadas com 3 dígitos)
  const highLoadAcc: number[] = []; // Carga > 3 (níveis 2 a 5 com 4 ou 5 dígitos)

  rounds.forEach((r) => {
    totalReplay += r.replayCount;

    if (r.omission || r.responseDigits.length === 0) {
      omissionsCount++;
      lowLoadAcc.push(0); // Omissão conta como precisão 0
      return;
    }

    // 1. Precisão Serial (posição exata)
    let serialMatches = 0;
    const len = r.targetDigits.length;
    for (let i = 0; i < len; i++) {
      if (r.responseDigits[i] === r.targetDigits[i]) {
        serialMatches++;
      }
    }
    const serialAcc = serialMatches / len;
    totalSerialAcc += serialAcc;

    // Classifica para cálculo de Custo de Carga
    if (len <= 3) {
      lowLoadAcc.push(serialAcc);
    } else {
      highLoadAcc.push(serialAcc);
    }

    // 2. Precisão Item a Item (independente de posição)
    let itemMatches = 0;
    // Conta interseção considerando duplicados
    const tempResponse = [...r.responseDigits];
    r.targetDigits.forEach((td) => {
      const idx = tempResponse.indexOf(td);
      if (idx !== -1) {
        itemMatches++;
        tempResponse.splice(idx, 1);
      }
    });
    totalItemAcc += itemMatches / len;

    // 3. Taxa de Intrusão do Distrator
    let intrusionMatches = 0;
    const tempResponseDist = [...r.responseDigits];
    r.distractorDigits.forEach((dd) => {
      const idx = tempResponseDist.indexOf(dd);
      if (idx !== -1) {
        intrusionMatches++;
        tempResponseDist.splice(idx, 1);
      }
    });
    // Taxa de intrusão é proporcional ao tamanho da resposta
    const intrusionRate = intrusionMatches / len;
    totalIntrusionRate += intrusionRate;

    // 4. Latência de Resposta (apenas válidas)
    if (r.responseLatencyMs > 0) {
      totalLatency += r.responseLatencyMs;
      validLatencyCount++;
    }
  });

  const avgSerial = totalSerialAcc / (totalRounds - omissionsCount || 1);
  const avgItem = totalItemAcc / (totalRounds - omissionsCount || 1);
  const avgIntrusion = totalIntrusionRate / (totalRounds - omissionsCount || 1);
  const avgLatency = validLatencyCount > 0 ? totalLatency / validLatencyCount : 0;

  // Custo de carga = Precisão de baixa carga (<= 3 digitos) - Alta carga (> 3 digitos)
  const avgLowLoad = lowLoadAcc.length > 0 ? lowLoadAcc.reduce((a, b) => a + b, 0) / lowLoadAcc.length : 0;
  const avgHighLoad = highLoadAcc.length > 0 ? highLoadAcc.reduce((a, b) => a + b, 0) / highLoadAcc.length : 0;
  const loadCost = Math.max(0, avgLowLoad - avgHighLoad);

  // Conversão Lúdica (Fôlego de Memória)
  // loadCost = Queda percentual (0 a 1)
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  const ludicScore = Math.round(clamp(100 - ((loadCost * 100) * 1.66), 0, 100));

  return {
    totalRounds,
    serialAccuracy: omissionsCount === totalRounds ? 0 : avgSerial,
    itemAccuracy: omissionsCount === totalRounds ? 0 : avgItem,
    omissions: omissionsCount,
    meanResponseTimeMs: avgLatency,
    distractorIntrusionRate: omissionsCount === totalRounds ? 0 : avgIntrusion,
    loadCost,
    avgReplayCount: totalReplay / totalRounds,
    ludicScore,
  };
}
