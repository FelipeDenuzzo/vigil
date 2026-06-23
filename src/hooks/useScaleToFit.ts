import { useState, useEffect } from 'react';

export function useScaleToFit(targetWidth: number, targetHeight: number, padding = 32) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function handleResize() {
      const availW = window.innerWidth - padding;
      const availH = window.innerHeight - padding;
      
      const scaleW = availW / targetWidth;
      const scaleH = availH / targetHeight;
      
      // Pega o menor fator de escala para caber na tela inteira, mas não aumenta além de 1 (100%)
      const newScale = Math.min(1, scaleW, scaleH);
      setScale(newScale);
    }

    handleResize(); // calcula na montagem
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetWidth, targetHeight, padding]);

  return scale;
}
