import { SalaDeVigiliaRawSession } from './types';

// Essa função existe como um ponto de entrada caso seja necessário 
// adaptar logs salvos do firestore (ex: campos que faltam em versões antigas).
// Para o fluxo ao vivo, apenas repassa a sessão bruta.
export function adaptSessionToSalaDeVigilia(
  rawSession: SalaDeVigiliaRawSession
): SalaDeVigiliaRawSession {
  return rawSession;
}
