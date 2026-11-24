import { AU_KM, DAY_SECONDS, JULIAN_YEAR_SECONDS, LIGHT_KM_S, LIGHT_YEAR_KM, MILESTONES, MOTIONS, REGIONS, journeyAt, milestonesAtDeparture } from "../src/features/cosmic/astronomy.js";
import { DEPARTURE_KEY, durationParts, formatDistance, persistResetDeparture, remainingText, selectDeparture, startCosmicUpdates } from "../src/features/cosmic/clock.js";

function equal<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
}

const textDuration = (s: number) => durationParts(s).map(({ value, unit }) => value + unit).join(" ");

export function runCosmicClockTests() {
  const year = JULIAN_YEAR_SECONDS;
  equal(Math.abs(LIGHT_KM_S * year - LIGHT_YEAR_KM) < 0.002, true, "light-year agrees within one floating-point step");
  equal(AU_KM, 149_597_870.7, "IAU astronomical unit");
  equal(MOTIONS.map(m => m.speed), [565, 230, 29.78, 1.022], "the four frame speeds remain independent");
  equal(MOTIONS.map(m => formatDistance(10, m.speed, "decimals" in m ? m.decimals : 0).value),
    ["5,650", "2,300", "297", "10.2"], "cumulative motion at ten seconds");
  equal(formatDistance(1, LIGHT_KM_S).value, "299,792", "light distance at one second");
  equal(formatDistance(600, LIGHT_KM_S).value, "179,875,474", "light distance at ten minutes");
  equal(formatDistance(3_000_000 * year, LIGHT_KM_S).value, "3,000,000", "million-year value stays readable");
  equal(formatDistance(1e300, LIGHT_KM_S).unit, "광년", "distance conversion also works beyond safe integer km");
  equal([0, 1, 10, 600, DAY_SECONDS, 30 * DAY_SECONDS, year, 10 * year, 2_000 * year, 3_000_000 * year]
    .map(textDuration), [
      "0초", "1초", "10초", "10분 00초", "1일 00시간 00분 00초", "30일 00시간 00분 00초",
      "1년 0일 00시간 00분 00초", "10년 0일 00시간 00분 00초",
      "2,000년 0일 00시간 00분 00초", "3,000,000년 0일 00시간 00분 00초",
    ], "duration rolls subunits without wrapping long ages");
  equal(textDuration(32 * DAY_SECONDS + 4 * 3600 + 21 * 60 + 17), "32일 04시간 21분 17초", "elapsed formatting");
  equal(remainingText(0.2), "1초 미만", "sub-second estimate");
  equal(remainingText(85 * DAY_SECONDS + 12 * 3600 + 34 * 60 + 20.2), "85일 12시간 34분 21초", "countdown shows the full displayed duration");

  equal(journeyAt(0).previous.id, "launch", "new journey starts from Earth");
  equal(journeyAt(0).earlier, null, "no earlier point at departure");
  for (let index = 1; index < MILESTONES.length; index++) {
    const point = MILESTONES[index], before = MILESTONES[index - 1], epsilon = point.km * 1e-12;
    equal(journeyAt(point.km - epsilon).previous.id, before.id, `before ${point.id}`);
    equal(journeyAt(point.km - epsilon).next?.id, point.id, `approaching ${point.id}`);
    equal(journeyAt(point.km).previous.id, point.id, `at ${point.id}`);
    equal(journeyAt(point.km).earlier?.id, before.id, `earlier milestone at ${point.id}`);
    equal(journeyAt(point.km + epsilon).previous.id, point.id, `after ${point.id}`);
    equal(journeyAt(point.km).next?.id ?? null, MILESTONES[index + 1]?.id ?? null, `next after ${point.id}`);
  }
  for (const [index, range] of REGIONS.entries()) {
    equal(journeyAt(range.startKm).region, range, "region entry is inclusive");
    if (index > 0) equal(REGIONS[index - 1].endKm, range.startKm, "regions have no gaps or overlaps");
  }
  equal(journeyAt(30.07 * AU_KM).region, journeyAt(30 * AU_KM).region, "Neptune benchmark does not replace Kuiper region");
  equal(journeyAt(20_000 * AU_KM).region, journeyAt(5_000 * AU_KM).region, "inner benchmark does not replace Oort region");
  equal([DAY_SECONDS, 30 * DAY_SECONDS, year, 10 * year, 2_000 * year, 3_000_000 * year]
    .map(s => journeyAt(s * LIGHT_KM_S).previous.id),
    ["heliopause", "oortIn", "oortInterior", "sirius", "orion", "triangulum"], "long elapsed time selects the matching milestone");
  equal(journeyAt(1e28).next, null, "final milestone does not end the journey");
  const monthJourney = journeyAt(30 * DAY_SECONDS * LIGHT_KM_S);
  equal([monthJourney.earlier?.id, monthJourney.previous.id, monthJourney.next?.id],
    ["heliopause", "oortIn", "oortInterior"], "all three path labels use registered distance points");

  const planets = [["mercury", "수성"], ["venus", "금성"], ["mars", "화성"], ["jupiter", "목성"],
    ["saturn", "토성"], ["uranus", "천왕성"], ["neptune", "해왕성"]] as const;
  // JPL Horizons geometric ranges from Earth's center, in km, at 00:00 UTC.
  const horizons = [
    ["2026-11-24", [160698243, 57030438, 185278191, 769209527, 1316210178, 2759282624, 4393839630], 0.0005, "venus"],
    ["2027-08-01", [183484401, 258780994, 265606117, 944706487, 1361552005, 2974276571, 4386279332], 0.0005, "sun"],
    ["2075-01-01", [149367815, 114550290, 347603968, 730905751, 1627464121, 3055650887, 4337614772], 0.0015, "venus"],
  ] as const;
  for (const [date, ranges, tolerance, firstAfterMoon] of horizons) {
    const departure = Date.parse(`${date}T00:00:00Z`);
    const points = milestonesAtDeparture(departure);
    equal(points, milestonesAtDeparture(departure), "the same departure recreates the same milestones");
    equal(journeyAt(384_400, points).next?.id, firstAfterMoon, "planet order follows departure distances");
    equal(points.filter(point => point.origin !== "earth-moon-barycenter"),
      MILESTONES.filter(point => point.origin !== "earth-moon-barycenter"), "non-planet benchmarks stay fixed");
    for (const [index, [id, name]] of planets.entries()) {
      const point = points.find(item => item.id === id)!;
      equal(point.name, name, "planet labels use only the name");
      equal(Math.abs(point.km / ranges[index] - 1) < tolerance, true, `JPL range for ${id} on ${date}`);
      equal(journeyAt(point.km - 1, points).next?.id, id, `approaching personalized ${id}`);
      equal(journeyAt(point.km, points).previous.id, id, `crossing personalized ${id}`);
    }
  }
  equal(milestonesAtDeparture(Date.UTC(4000, 0, 1)), MILESTONES, "out-of-range dates fall back to J2000");

  const now = 1_800_000_000_000;
  let value: string | null = null, writes = 0;
  const storage = {
    get(key: string) { equal(key, DEPARTURE_KEY, "storage key"); return value; },
    set(key: string, next: string) { equal(key, DEPARTURE_KEY, "storage key"); value = next; writes++; return true; },
  };
  equal(selectDeparture(storage, now), { at: now, saved: true }, "first visit persists");
  equal(selectDeparture(storage, now + DAY_SECONDS * 1000), { at: now, saved: true }, "later visit keeps timestamp");
  equal(selectDeparture(storage, now - 60_000), { at: now, saved: true }, "future timestamps survive backward clock changes");
  equal(writes, 1, "valid timestamps never rewritten");
  for (const invalid of ["", " ", "NaN", "Infinity", "0x15", '{"at":17}', "2.1"]) {
    value = invalid;
    equal(selectDeparture(storage, now), { at: now, saved: true }, "corrupt value is replaced");
  }
  const unavailable = { get: () => null, set: () => false };
  equal(selectDeparture(unavailable, now + 5000, now), { at: now, saved: false }, "in-memory fallback survives remount");
  const resetAt = now + 60_000;
  equal(persistResetDeparture(unavailable, resetAt), null, "failed write cannot start a reset journey");
  equal(selectDeparture(storage, resetAt).at, now, "the old departure survives a failed reset");
  equal(persistResetDeparture(storage, resetAt), { at: resetAt, saved: true }, "explicit reset writes the new departure");
  equal(selectDeparture(storage, resetAt + 1000).at, resetAt, "the new departure survives remount");

  let wall = now, mono = 0, visible = true, listener: (() => void) | undefined;
  let serial = 0, last = -1, calls = 0;
  const tasks = new Map<number, (timestamp: number) => void>();
  const stop = startCosmicUpdates(now, {
    wallNow: () => wall,
    monotonicNow: () => mono,
    visible: () => visible,
    subscribe(fn) { listener = fn; return () => { listener = undefined; }; },
    requestFrame(fn) { tasks.set(++serial, fn); return serial; },
    cancelFrame(id) { tasks.delete(id); },
  }, seconds => { last = seconds; calls++; });
  function tick(addWall: number, addMono: number) {
    wall += addWall; mono += addMono;
    equal(tasks.size, 1, "one queued frame while visible");
    const entry = tasks.entries().next().value!;
    tasks.delete(entry[0]);
    entry[1](Math.round(mono * 10) / 10);
  }
  equal(last, 0, "first frame shows zero");
  tick(1030, 1000);
  equal(last, 1, "small wall drift does not disturb monotonic time");
  tick(-31_030, 1000);
  equal(last, 1, "backward correction holds current time");
  tick(32_000, 1000);
  equal(last, 2, "wall time catches up after correction");
  visible = false;
  listener!();
  equal(tasks.size, 0, "hidden tab has no schedule");
  wall += 30 * DAY_SECONDS * 1000;
  visible = true;
  listener!();
  equal(last, 30 * DAY_SECONDS + 2, "resume picks up elapsed time without background computation");

  for (const hz of [30, 60, 120, 144, 180]) {
    listener!();
    const before = calls;
    const interval = 1000 / hz;
    for (let i = 0; i < hz * 2; i++) tick(interval, interval);
    equal(calls - before, 2 * Math.min(hz, 60), `samples on a ${hz} Hz display over two seconds`);
  }
  const beforeGapCalls = calls;
  tick(800, 800);
  equal(calls - beforeGapCalls, 1, "a delayed frame does not replay missed updates");
  equal(Math.round(last * 1000), Math.round(wall - now), "distance uses elapsed time even after missed updates");

  const stale = [...tasks.values()][0];
  const previousCalls = calls;
  stop();
  stale(mono + 1000);
  equal([tasks.size, listener, calls], [0, undefined, previousCalls], "unmount cancels and rejects stale updates");
}
