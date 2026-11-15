/** A deliberate horizontal drag or short flick, never a scroll or small tap. */
export function swipeDirection(dx: number, dy: number, elapsed: number, width: number): -1 | 0 | 1 {
  const distance = Math.abs(dx);
  if (distance < 18 || distance < Math.abs(dy) * 1.35) return 0;
  const threshold = Math.min(80, Math.max(40, width * 0.12));
  const flick = distance >= 24 && distance / Math.max(1, elapsed) >= 0.45;
  return distance >= threshold || flick ? dx < 0 ? 1 : -1 : 0;
}
