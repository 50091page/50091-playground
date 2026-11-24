import { DAY_SECONDS, JULIAN_YEAR_SECONDS, LIGHT_YEAR_KM } from "./astronomy.js";

export const DEPARTURE_KEY = "50091.cosmic.departure.v1";
const UPDATE_MS = 1000 / 60;
const FRAME_TOLERANCE_MS = 0.5;
const WALL_CORRECTION_MS = 2_000;

type StorageAccess = {
  get: (key: string) => string | null;
  set: (key: string, value: string) => boolean;
};

export function selectDeparture(storage: StorageAccess, now: number, fallback?: number) {
  const saved = storage.get(DEPARTURE_KEY);
  if (saved !== null && /^-?\d+$/.test(saved) && Number.isInteger(Number(saved))) {
    return { at: Number(saved), saved: true };
  }
  const at = fallback ?? now;
  return { at, saved: storage.set(DEPARTURE_KEY, String(at)) };
}

export function persistResetDeparture(storage: Pick<StorageAccess, "set">, now: number) {
  return storage.set(DEPARTURE_KEY, String(now)) ? { at: now, saved: true } : null;
}

type ClockEnvironment = {
  wallNow: () => number;
  monotonicNow: () => number;
  visible: () => boolean;
  subscribe: (listener: () => void) => () => void;
  requestFrame: (listener: (timestamp: number) => void) => number;
  cancelFrame: (frame: number) => void;
};

export function startCosmicUpdates(
  departure: number,
  env: ClockEnvironment,
  show: (elapsedSeconds: number) => void,
) {
  let wallAnchor = 0, monoAnchor = 0, lastElapsed = 0, stopped = false;
  let frame: number | undefined, frameOrigin: number | undefined, lastSlot = -1;
  function render(forceSync = false) {
    const wall = env.wallNow(), mono = env.monotonicNow();
    if (forceSync || Math.abs(wall - (wallAnchor + mono - monoAnchor)) >= WALL_CORRECTION_MS) {
      wallAnchor = wall;
      monoAnchor = mono;
    }
    // A backward clock correction can hold the display, but cannot make an open journey go backwards.
    lastElapsed = Math.max(lastElapsed, (wallAnchor - departure + mono - monoAnchor) / 1000);
    show(lastElapsed);
  }
  function tick(timestamp: number) {
    frame = undefined;
    if (stopped || !env.visible()) return;
    frameOrigin ??= timestamp;
    // Allow for timestamp rounding and skip missed slots instead of replaying them.
    const slot = Math.floor((timestamp - frameOrigin + FRAME_TOLERANCE_MS) / UPDATE_MS);
    if (slot > lastSlot) {
      lastSlot = slot;
      render();
    }
    if (!stopped) frame = env.requestFrame(tick);
  }
  function cancel() {
    if (frame !== undefined) env.cancelFrame(frame);
    frame = undefined;
  }
  function resync() {
    if (stopped) return;
    cancel();
    if (!env.visible()) return;
    frameOrigin = undefined;
    lastSlot = -1;
    render(true);
    if (!stopped) frame = env.requestFrame(tick);
  }
  const unsubscribe = env.subscribe(resync);
  resync();
  return () => {
    stopped = true;
    cancel();
    unsubscribe();
  };
}

const integer = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const tenth = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const lightYears = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 6 });
const scientific = new Intl.NumberFormat("ko-KR", { notation: "scientific", maximumFractionDigits: 4 });

export function formatDistance(seconds: number, speed: number, decimals = 0) {
  const km = seconds * speed;
  if (km >= 1e15) {
    const ly = seconds * (speed / LIGHT_YEAR_KM);
    const value = (ly >= 1e12 ? scientific : lightYears).format(ly);
    return { value, unit: "광년", long: value.length > 14 };
  }
  const value = decimals === 1 ? tenth.format(Math.floor(km * 10) / 10) : integer.format(Math.floor(km));
  return { value, unit: "km", long: value.length > 14 };
}

export function durationParts(seconds: number) {
  const total = Math.floor(seconds);
  // Physical duration: Julian years, not calendar anniversaries or local-time days.
  const units = [
    [JULIAN_YEAR_SECONDS, "년"], [DAY_SECONDS, "일"], [3600, "시간"], [60, "분"], [1, "초"],
  ] as const;
  let remaining = total;
  return units.flatMap(([size, unit], index) => {
    const value = Math.floor(remaining / size);
    remaining %= size;
    if (value === 0 && index !== units.length - 1 && total < size) return [];
    return [{
      unit,
      value: unit === "년" && value >= 1e12
        ? scientific.format(value)
        : integer.format(value).padStart(size <= 3600 && total >= units[index - 1][0] ? 2 : 1, "0"),
    }];
  });
}

export function remainingText(seconds: number) {
  if (seconds < 1) return "1초 미만";
  return durationParts(Math.ceil(seconds)).map(({ value, unit }) => value + unit).join(" ");
}
