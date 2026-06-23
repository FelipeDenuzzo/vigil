// src/attentions/divided/SelectiveListeningPlay.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { SelectiveListening } from './games/SelectiveListening/SelectiveListening';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db, { auth } from '../../lib/firebase';

const SelectiveListeningPlay: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => uuidv4());
  const [saving, setSaving] = useState(false);

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
      navigate(`/treinar/dividida/escuta-seletiva/resultado?sessionId=${sessionId}`, {
        state: { rodadas: res.rodadas }
      });
    } catch (e) {
      console.error('[SelectiveListening] Erro ao gravar dados da sessão:', e);
      // Mesmo se falhar, navega para a página de resultado para tentar carregar
      navigate(`/treinar/dividida/escuta-seletiva/resultado?sessionId=${sessionId}`);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: 'var(--space-4)' }}>
        <Button
          variant="ghost"
          onClick={() => navigate('/treinar/dividida')}
          style={{ marginBottom: 'var(--space-2)' }}
          disabled={saving}
        >
          ← Voltar
        </Button>
      </header>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {saving ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Salvando dados do treino...</p>
          </div>
        ) : (
          <SelectiveListening
            sessionId={sessionId}
            onClose={() => navigate('/treinar/dividida')}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
};

export default SelectiveListeningPlay;
