// src/attentions/alternating/games/TrilhaZigueZague/TrilhaZigueZagueGame.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TrilhaNode } from './types';

interface TrilhaZigueZagueGameProps {
  nodes: TrilhaNode[];
  expectedSequence: string[];
  isPhase2: boolean; // if true, errors are split into shifting vs sequencing
  onComplete: (timeMs: number, shiftingErrs: number, sequencingErrs: number) => void;
}

export const TrilhaZigueZagueGame: React.FC<TrilhaZigueZagueGameProps> = ({
  nodes,
  expectedSequence,
  isPhase2,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
  const [errorNodeId, setErrorNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Stats
  const startMsRef = useRef<number>(0);
  const shiftingErrsRef = useRef(0);
  const sequencingErrsRef = useRef(0);

  useEffect(() => {
    startMsRef.current = performance.now();
  }, []);

  const handleNodeClick = useCallback(
    (clickedNode: TrilhaNode) => {
      if (currentIndex >= expectedSequence.length) return;
      
      const expectedId = expectedSequence[currentIndex];
      
      if (clickedNode.id === expectedId) {
        // Correct!
        setErrorNodeId(null);
        
        // Draw line from previous node if any
        if (currentIndex > 0) {
          const prevId = expectedSequence[currentIndex - 1];
          const prevNode = nodes.find(n => n.id === prevId);
          if (prevNode) {
            setLines(prev => [...prev, { x1: prevNode.x, y1: prevNode.y, x2: clickedNode.x, y2: clickedNode.y }]);
          }
        }
        
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        
        // Check if finished
        if (nextIndex >= expectedSequence.length) {
          const endMs = performance.now();
          const totalMs = endMs - startMsRef.current;
          onComplete(totalMs, shiftingErrsRef.current, sequencingErrsRef.current);
        }
      } else {
        // Incorrect
        setErrorNodeId(clickedNode.id);
        
        if (isPhase2) {
          // Determine if shifting or sequencing error
          // Sequence: 1, A, 2, B, 3, C...
          const isExpectedNumber = !isNaN(Number(expectedId));
          const isClickedNumber = !isNaN(Number(clickedNode.id));
          
          if (isExpectedNumber !== isClickedNumber) {
            // Expected a number but clicked a letter, or expected a letter but clicked a number
            sequencingErrsRef.current += 1; // Wait, actually:
            // Example: Just clicked '1'. Expected 'A'. 
            // If they click '2', they didn't shift. So isExpectedNumber (false) !== isClickedNumber (true)
            // So if isExpectedNumber !== isClickedNumber, it means they clicked the RIGHT category but wrong item?
            // Let's trace: Expected 'A' (letter). Clicked '2' (number). They are DIFFERENT categories. 
            // This means they FAILED to shift to letter. It's a shifting error!
            shiftingErrsRef.current += 1;
          } else {
            // Expected 'A' (letter), Clicked 'B' (letter). SAME category, wrong sequence.
            sequencingErrsRef.current += 1;
          }
        } else {
          // Phase 1 just has generic sequencing errors
          sequencingErrsRef.current += 1;
        }

        // Clear error visually after a short delay
        setTimeout(() => setErrorNodeId(null), 400);
      }
    },
    [currentIndex, expectedSequence, isPhase2, nodes, onComplete]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        aspectRatio: '1/1',
        margin: '0 auto',
        backgroundColor: '#0f111a',
        borderRadius: '12px',
        border: '1px solid #2d3047',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Draw lines (SVG overlay) */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {lines.map((line, i) => (
          <line
            key={i}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Draw nodes */}
      {nodes.map(node => {
        const isClicked = expectedSequence.indexOf(node.id) < currentIndex;
        const isError = errorNodeId === node.id;
        
        let bgColor = '#1e2133';
        let borderColor = '#3a3f58';
        let color = '#a3a8cc';
        
        if (isClicked) {
          bgColor = '#10b981';
          borderColor = '#059669';
          color = '#ffffff';
        } else if (isError) {
          bgColor = '#ef4444';
          borderColor = '#b91c1c';
          color = '#ffffff';
        }

        return (
          <div
            key={node.id}
            onPointerDown={() => !isClicked && handleNodeClick(node)}
            style={{
              position: 'absolute',
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 600,
              cursor: isClicked ? 'default' : 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s',
              boxShadow: isError ? '0 0 15px rgba(239,68,68,0.5)' : (isClicked ? '0 0 10px rgba(16,185,129,0.3)' : 'none'),
              zIndex: isClicked ? 1 : 2
            }}
          >
            {node.label}
          </div>
        );
      })}
    </div>
  );
};

export default TrilhaZigueZagueGame;
