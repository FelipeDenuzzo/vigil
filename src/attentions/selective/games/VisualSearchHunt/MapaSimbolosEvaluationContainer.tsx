// src/attentions/selective/games/VisualSearchHunt/MapaSimbolosEvaluationContainer.tsx

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMapaSimbolosEvaluation } from './useMapaSimbolosEvaluation';
import type { MapaSimbolosEvaluationReport } from './useMapaSimbolosEvaluation';
import { MapaSimbolosEvaluationScreen } from './MapaSimbolosEvaluationScreen';
import { getSessionById } from '../../../../shared/storage';

export function MapaSimbolosEvaluationContainer() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const navigate = useNavigate();
  const sessionLog = getSessionById(sessionId);

  const [report, setReport] = useState<MapaSimbolosEvaluationReport | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionId) return;

    setLoaded(false);
    setReport(null);

    (async () => {
      try {
        const result = await useMapaSimbolosEvaluation(sessionId);
        setReport(result);
      } catch (err) {
        console.warn('[MapaSimbolosEvaluationContainer] erro ao avaliar sessão:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [sessionId]);

  if (!sessionLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#8b8fa8' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <MapaSimbolosEvaluationScreen
        report={report}
        loaded={loaded}
        onRepeatTraining={() => navigate('/treinar/seletiva/mapa-de-simbolos')}
        onBackToStart={() => navigate('/treinar/seletiva')}
      />
    </div>
  );
}

export default MapaSimbolosEvaluationContainer;
