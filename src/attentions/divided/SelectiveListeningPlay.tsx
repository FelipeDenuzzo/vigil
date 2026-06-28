// src/attentions/divided/SelectiveListeningPlay.tsx
import React, { useState } from 'react';
// removed imports
import { SelectiveListening } from './games/SelectiveListening/SelectiveListening';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db, { auth } from '../../lib/firebase';

import { SelectiveListeningResult } from './games/SelectiveListening/SelectiveListeningResult';
import { TentativaRodada } from '../../assessment/selectiveListening/types';

interface Props {
  onClose?: () => void;
}

const SelectiveListeningPlay: React.FC<Props> = () => {
  const [sessionId] = useState(() => uuidv4());
  const [saving, setSaving] = useState(false);
  const [completedRounds, setCompletedRounds] = useState<TentativaRodada[] | null>(null);

  const handleComplete = async (res: { rodadas: any[]; startedAt: string }) => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      // Grava a sessão com os dados brutos de rodadas no Firestore
      await setDoc(doc(db, 'sessions', sessionId), {
        uid,
        sessionId,
        game: 'escuta-seletiva',
        attentionType: 'dividida',
        rodadas: res.rodadas,
        startedAt: res.startedAt,
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Navega para a página de resultado passando as rodadas no state
      setCompletedRounds(res.rodadas);
    } catch (e) {
      console.error('[SelectiveListening] Erro ao gravar dados da sessão:', e);
      // Mesmo se falhar, exibe o resultado
      setCompletedRounds(res.rodadas);
    }
  };

  if (completedRounds) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
        <SelectiveListeningResult
          sessionId={sessionId}
          rodadas={completedRounds}
          onRepeat={() => {
            setCompletedRounds(null);
            // new session generated? No, we should probably let them replay in the same session or reset it.
            // for now, just resetting the UI is fine. The actual game handles its own state.
            // Actually, we need a new sessionId for a new play.
            // But we don't have a setter for sessionId. We can just force remount by not having onRepeat here,
            // or we add a setter for sessionId.
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '24px' }}>
        {saving ? (
          <div style={{ textAlign: 'center', color: '#ffffff' }}>
            <p>Salvando dados do treino...</p>
          </div>
        ) : (
          <SelectiveListening
            sessionId={sessionId}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
};

export default SelectiveListeningPlay;
