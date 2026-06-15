import React from 'react';
import { MazeSessionResult } from './types';

interface Props {
  onComplete?: (result: MazeSessionResult) => void;
  onClose?: () => void;
}

export const LabirintosProlongadosGame: React.FC<Props> = ({ onComplete, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg shadow-md h-full w-full">
      <h2 className="text-2xl font-bold mb-4">Labirintos Prolongados</h2>
      <p className="text-gray-600 mb-6">Em desenvolvimento. Foco em atenção sustentada.</p>
      <div className="flex gap-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            if (onComplete) {
              onComplete({
                levelId: 1,
                success: true,
                elapsedMs: 15000,
                steps: 20,
                revisits: 2,
                shortestPathLength: 15,
                efficiency: 0.75
              });
            }
          }}
        >
          Simular Conclusão
        </button>
        {onClose && (
          <button 
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
};
