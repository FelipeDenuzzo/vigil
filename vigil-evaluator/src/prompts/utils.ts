export function formatMsToSeconds(ms: number | string | null | undefined): string {
  if (ms == null || ms === 'indisponível') return 'indisponível';
  
  const num = typeof ms === 'string' ? parseFloat(ms) : ms;
  if (isNaN(num)) return 'indisponível';
  
  const seconds = num / 1000;
  // Use 2 decimal places for small values (< 0.1s) so they don't round to 0.0, otherwise 1 decimal place or whole number
  const formatted = seconds === 0
    ? '0'
    : (seconds % 1 === 0
        ? seconds.toString()
        : (Math.abs(seconds) < 0.1 ? seconds.toFixed(2) : seconds.toFixed(1)));
  
  return `${formatted.replace('.', ',')} segundos`;
}
