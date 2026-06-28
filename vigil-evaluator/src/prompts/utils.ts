export function formatMsToSeconds(ms: number | string | null | undefined): string {
  if (ms == null || ms === 'indisponível') return 'indisponível';
  
  const num = typeof ms === 'string' ? parseFloat(ms) : ms;
  if (isNaN(num)) return 'indisponível';
  
  const seconds = num / 1000;
  // Use 1 decimal place if it's not a whole number, otherwise just the whole number
  const formatted = seconds % 1 === 0 ? seconds.toString() : seconds.toFixed(1);
  
  return `${formatted.replace('.', ',')} segundos`;
}
