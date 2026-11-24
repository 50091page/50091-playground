export const ATTEMPT_COUNT = 5;
export const WAIT_MIN_MS = 1500;
export const WAIT_MAX_MS = 5000;

const MAX_START_DELAY_MS = 150;
const MAX_PRESENTATION_DELAY_MS = 120;
const REPEAT_WINDOW_MS = 250;
const REPEAT_RADIUS_PX = 24;

export type InputKind = "mouse" | "touch" | "pen" | "keyboard";
export type Phase = "idle" | "waiting" | "ready" | "result" | "too-early" | "interrupted" | "completed";
type Interruption = "focus" | "render" | "clock";
type Attempt = { ms: number; kind: InputKind };
type Hit = { stamp: number; kind: InputKind; x: number; y: number };
type TimedHit = Hit & { at: number };

export type ReactionView = {
  phase: Phase;
  count: number;
  latest?: number;
  interruption?: Interruption;
};

export type ReactionSummary = {
  times: number[];
  kind: InputKind | "mixed";
  average: number;
  median: number;
  fastest: number;
  slowest: number;
  falseStarts: number;
};

type Environment = {
  now: () => number;
  timeOrigin: number;
  random: () => number;
  available: () => boolean;
  setTimer: (fn: () => void, delay: number) => number;
  clearTimer: (id: number) => void;
  requestFrame: (fn: () => void) => number;
  cancelFrame: (id: number) => void;
  onView: (view: ReactionView) => void;
  onComplete: (summary: ReactionSummary) => void;
};

export function normalizeEventTime(stamp: number, handledAt: number, timeOrigin: number): number | null {
  const value = stamp >= 1e12 && timeOrigin >= 1e12 ? stamp - timeOrigin : stamp;
  return Number.isFinite(value) && value > 0 && value <= handledAt ? value : null;
}

function summarize(attempts: Attempt[], falseStarts: number): ReactionSummary {
  const times = attempts.map(({ ms }) => ms);
  const sorted = [...times].sort((a, b) => a - b);
  const kind = attempts[0].kind;
  return {
    times,
    kind: attempts.every((attempt) => attempt.kind === kind) ? kind : "mixed",
    average: times.reduce((sum, ms) => sum + ms, 0) / times.length,
    median: sorted[2],
    fastest: sorted[0],
    slowest: sorted[sorted.length - 1],
    falseStarts,
  };
}

export function createReactionSession(env: Environment) {
  let phase: Phase = "idle";
  let attempts: Attempt[] = [];
  let falseStarts = 0;
  let timer: number | undefined;
  let frame: number | undefined;
  let generation = 0;
  let onset = 0;
  let waitingSince = 0;
  let presentationChecked = false;
  let ignoreBefore = 0;
  let lastInput = 0;
  let lastOutcome: TimedHit | undefined;
  let disposed = false;

  function cancel() {
    generation += 1;
    if (timer !== undefined) env.clearTimer(timer);
    if (frame !== undefined) env.cancelFrame(frame);
    timer = frame = undefined;
  }

  function show(next: Phase, interruption?: Interruption) {
    phase = next;
    env.onView({ phase, count: attempts.length, latest: attempts[attempts.length - 1]?.ms, interruption });
  }

  function interrupt(reason: Interruption = "focus") {
    if (disposed || (phase !== "waiting" && phase !== "ready")) return;
    cancel();
    ignoreBefore = env.now();
    show("interrupted", reason);
  }

  function begin() {
    cancel();
    lastOutcome = undefined;
    presentationChecked = false;
    show("waiting");
    waitingSince = env.now();
    const delay = WAIT_MIN_MS + Math.floor(env.random() * (WAIT_MAX_MS - WAIT_MIN_MS + 1));
    const deadline = waitingSince + delay;
    const guard = generation;
    const queueStimulus = () => {
      if (generation !== guard) return;
      timer = undefined;
      const remaining = deadline - env.now();
      if (remaining > 0) {
        timer = env.setTimer(queueStimulus, Math.ceil(remaining));
        return;
      }
      frame = env.requestFrame(() => {
        if (generation !== guard) return;
        frame = undefined;
        if (!env.available()) return interrupt("focus");
        if (env.now() - deadline > MAX_START_DELAY_MS) return interrupt("render");
        show("ready");
        // Timestamp the synchronous DOM change, not the frame callback's timestamp or physical paint.
        onset = env.now();
        frame = env.requestFrame(() => {
          if (generation !== guard) return;
          frame = undefined;
          if (!env.available()) return interrupt("focus");
          if (env.now() - onset > MAX_PRESENTATION_DELAY_MS) return interrupt("render");
          presentationChecked = true;
        });
      });
    };
    timer = env.setTimer(queueStimulus, delay);
  }

  function input(hit: Hit, handledAt: number) {
    if (disposed || phase === "completed") return;
    if (!env.available()) return interrupt("focus");
    const at = normalizeEventTime(hit.stamp, handledAt, env.timeOrigin);
    if (at === null) return interrupt("clock");
    if (at <= ignoreBefore || at <= lastInput) return;
    lastInput = at;

    if (phase !== "waiting" && phase !== "ready") {
      if (lastOutcome && hit.kind === lastOutcome.kind && at - lastOutcome.at < REPEAT_WINDOW_MS &&
          Math.hypot(hit.x - lastOutcome.x, hit.y - lastOutcome.y) <= REPEAT_RADIUS_PX) return;
      begin();
      return;
    }

    if (at < waitingSince) return;
    if (phase === "waiting" || at <= onset) {
      cancel();
      lastOutcome = { ...hit, at };
      falseStarts += 1;
      show("too-early");
      return;
    }
    if (!presentationChecked && handledAt - onset > MAX_PRESENTATION_DELAY_MS) return interrupt("render");

    cancel();
    lastOutcome = { ...hit, at };
    attempts.push({ ms: at - onset, kind: hit.kind });
    if (attempts.length < ATTEMPT_COUNT) {
      show("result");
    } else {
      show("completed");
      env.onComplete(summarize(attempts, falseStarts));
    }
  }

  function reset() {
    if (disposed) return;
    cancel();
    attempts = [];
    falseStarts = 0;
    ignoreBefore = env.now();
    lastOutcome = undefined;
    show("idle");
  }

  show("idle");
  return {
    input,
    interrupt: () => interrupt(),
    reset,
    dispose() {
      disposed = true;
      cancel();
    },
  };
}
