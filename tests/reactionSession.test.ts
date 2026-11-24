import {
  createReactionSession, normalizeEventTime, WAIT_MAX_MS, WAIT_MIN_MS,
  type InputKind, type ReactionSummary, type ReactionView,
} from "../src/features/reaction/session.js";

const ORIGIN = 1_800_000_000_000;

function equal<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function harness() {
  let now = 100;
  let nextId = 0;
  let available = true;
  const timers = new Map<number, { fn: () => void; delay: number }>();
  const frames = new Map<number, () => void>();
  const views: ReactionView[] = [];
  const summaries: ReactionSummary[] = [];
  const draws = [0, 0.9999, 0.25, 0.75];
  const session = createReactionSession({
    now: () => now,
    timeOrigin: ORIGIN,
    random: () => draws.shift() ?? 0,
    available: () => available,
    setTimer: (fn, delay) => {
      timers.set(++nextId, { fn, delay });
      return nextId;
    },
    clearTimer: (id) => { timers.delete(id); },
    requestFrame: (fn) => {
      frames.set(++nextId, fn);
      return nextId;
    },
    cancelFrame: (id) => { frames.delete(id); },
    onView: (view) => {
      views.push(view);
      if (view.phase === "ready") now += 0.25;
    },
    onComplete: (summary) => { summaries.push(summary); },
  });
  return {
    ...session,
    timers,
    frames,
    summaries,
    view: () => views[views.length - 1],
    now: () => now,
    elapse: (ms: number) => { now += ms; },
    loseFocus: () => { available = false; },
    click: (stamp = now, x = 24, kind: InputKind = "mouse") => session.input({ stamp, kind, x, y: 24 }, now),
    fireTimer(extra = 0) {
      const [id, { fn, delay }] = [...timers][0];
      timers.delete(id);
      now += delay + extra;
      fn();
    },
    drawFrame(elapsed = 0) {
      const [id, fn] = [...frames][0];
      frames.delete(id);
      now += elapsed;
      fn();
      return now;
    },
    present() {
      this.fireTimer();
      const onset = this.drawFrame(5);
      equal(this.view().phase, "ready", "the first frame shows the stimulus");
      this.drawFrame(16);
      return onset;
    },
  };
}

export function runReactionSessionTests() {
  equal(normalizeEventTime(21.1875, 120, ORIGIN), 21.1875, "relative timestamps keep full precision");
  equal(normalizeEventTime(ORIGIN + 21.125, 120, ORIGIN), 21.125, "legacy epoch timestamps use the same origin");
  for (const stamp of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 121, ORIGIN - 30]) {
    equal(normalizeEventTime(stamp, 120, ORIGIN), null, "invalid and future timestamps are rejected");
  }

  const game = harness();
  game.click();
  equal([...game.timers.values()][0].delay, WAIT_MIN_MS, "minimum delay");
  game.fireTimer();
  const onset = game.drawFrame(5);
  game.elapse(36);
  game.click(onset - 4);
  equal(game.view().phase, "too-early", "early event dispatched after green is still premature");
  equal(game.frames.size, 0, "false start cancels presentation probe");
  game.click(onset - 4, 90);
  equal(game.view().phase, "too-early", "duplicate input with the same timestamp");
  game.click();
  equal(game.view().phase, "too-early", "double input at the same point does not restart");
  game.elapse(1);
  game.click(game.now(), 90);
  equal([...game.timers.values()][0].delay, WAIT_MAX_MS, "immediate distinct input retries with a new random delay");

  const times = [235.25, 104.125, 10_000.5, 95.625, 270.75];
  times.forEach((ms, index) => {
    const response = game.present() + ms;
    game.elapse(ms + 330);
    game.click(response, 90);
    equal(game.view().latest, ms, "response uses native input time, not the delayed handler");
    equal(game.view().count, index + 1, "only valid responses are counted");
    if (index < 4) {
      equal(game.view().phase, "result", "result shown after each valid attempt");
      game.click(response + 30, 90);
      equal(game.view().phase, "result", "a second press from the same place stays on the result");
      game.click();
      equal(game.view().phase, "waiting", "a separate input starts the next attempt");
    }
  });
  equal(game.summaries[0], {
    times, kind: "mouse", average: times.reduce((sum, time) => sum + time, 0) / 5,
    median: 235.25, fastest: 95.625, slowest: 10_000.5, falseStarts: 1,
  }, "session aggregates full-precision valid inputs including slow responses");
  game.reset();
  equal(game.view(), { phase: "idle", count: 0 }, "retry clears attempts");

  const early = harness();
  early.click();
  early.elapse(400);
  early.click();
  equal(early.view().phase, "too-early", "press in the red phase counts as premature");
  equal(early.timers.size, 0, "false start cancels timer");

  const blurred = harness();
  blurred.click();
  blurred.fireTimer();
  blurred.loseFocus();
  blurred.interrupt();
  equal(blurred.view().interruption, "focus", "blur invalidates queued stimulus");
  equal(blurred.frames.size, 0, "blur cancels frame");

  const hidden = harness();
  hidden.click();
  hidden.present();
  hidden.loseFocus();
  hidden.click();
  equal(hidden.view().interruption, "focus", "hidden or unfocused input is invalid without a blur callback");

  const stalled = harness();
  stalled.click();
  stalled.fireTimer(200);
  stalled.drawFrame();
  equal(stalled.view().interruption, "render", "an excessively late initial frame is invalid");
  stalled.elapse(10);
  stalled.click();
  stalled.fireTimer();
  stalled.drawFrame();
  stalled.drawFrame(160);
  equal(stalled.view().interruption, "render", "an excessively late frame after visual update is invalid");
  stalled.elapse(10);
  stalled.click();
  stalled.fireTimer();
  const laterOnset = stalled.drawFrame();
  stalled.elapse(140);
  stalled.click(laterOnset + 80);
  equal(stalled.view().interruption, "render", "input cannot score during an unconfirmed stall");

  const clock = harness();
  clock.click();
  clock.present();
  clock.click(-1);
  equal(clock.view().interruption, "clock", "incompatible clocks never fall back to handler time");
  clock.elapse(2);
  clock.click();
  clock.fireTimer();
  const stale = [...clock.frames.values()][0];
  clock.reset();
  equal(clock.frames.size, 0, "reset cancels queued frame");
  stale();
  equal(clock.view().phase, "idle", "stale callbacks from before reset cannot drive the UI");
  clock.elapse(2);
  clock.click();
  const staleTimer = [...clock.timers.values()][0].fn;
  clock.dispose();
  staleTimer();
  equal([clock.timers.size, clock.frames.size], [0, 0], "dispose clears timers and rejects stale callbacks");
}
