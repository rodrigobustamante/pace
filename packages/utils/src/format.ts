// Meters → km with 1 decimal
export const mToKm = (meters: number): string => (meters / 1000).toFixed(1);

// Seconds → "MM:SS" (pace display, e.g. "5:32")
export const secToPace = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Seconds → "HH:MM:SS" or "MM:SS" (duration display)
export const secToDuration = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
};

// TSB → human-readable form label (Spanish for athlete UI)
export const tsbLabel = (tsb: number): string => {
  if (tsb < -20) return "Sobreentrenado";
  if (tsb < -10) return "Muy fatigado";
  if (tsb < -5) return "Algo fatigado";
  if (tsb < 5) return "Equilibrado";
  if (tsb < 15) return "Fresco";
  return "Muy descansado";
};

// HR → zone number (1–5)
export const hrZone = (hr: number, maxHR: number): 1 | 2 | 3 | 4 | 5 => {
  const pct = hr / maxHR;
  if (pct < 0.6) return 1;
  if (pct < 0.7) return 2;
  if (pct < 0.8) return 3;
  if (pct < 0.9) return 4;
  return 5;
};

// Riegel race time predictor
export const predictRaceTime = (
  knownTimeSec: number,
  knownDistM: number,
  targetDistM: number,
): number =>
  Math.round(knownTimeSec * Math.pow(targetDistM / knownDistM, 1.06));
