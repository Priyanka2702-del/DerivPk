function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

function seededRandom(seed: number) {
  let s = seed | 0;
  return function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generates a stable-looking trend line (0-100 range) seeded by `seed`. */
export function generateSparklineData(seed: string, up: boolean, points = 24): number[] {
  const rand = seededRandom(hashString(seed));
  const drift = up ? 1.6 : -1.3;
  const series: number[] = [];
  let value = 45;
  for (let i = 0; i < points; i++) {
    value += drift + (rand() - 0.5) * 9;
    value = Math.max(5, Math.min(95, value));
    series.push(value);
  }
  return series;
}