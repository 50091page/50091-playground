import { RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { journeyAt, journeyProgress, journeySegment, LIGHT_KM_S, milestonesAtDeparture, MOTIONS } from "../features/cosmic/astronomy";
import { durationParts, formatDistance, persistResetDeparture, remainingText, selectDeparture, startCosmicUpdates } from "../features/cosmic/clock";
import { MilestoneSymbol, milestoneLineStyle } from "../features/cosmic/MilestoneSymbol";
import { safeLocalStorageGet, safeLocalStorageSet } from "../utils/storage";
import "../styles/cosmic-clock.css";

const distanceSpecs = [...MOTIONS, { id: "light", speed: LIGHT_KM_S }] as const;
const storage = { get: safeLocalStorageGet, set: safeLocalStorageSet };
let memoryDeparture: number | undefined;

function Distance({ id }: { id: string }) {
  return (
    <span className="cosmic-distance" data-distance={id}>
      <span className="cosmic-value">0</span>{" "}
      <span className="cosmic-unit">km</span>
    </span>
  );
}

function Duration({ seconds }: { seconds: number }) {
  return (
    <p className="cosmic-duration">
      {durationParts(seconds).map(({ value, unit }) => (
        <span key={unit}>{value}<span className="cosmic-unit">{unit}</span></span>
      ))}
    </p>
  );
}

export default function CosmicClockPage() {
  const page = useRef<HTMLElement>(null);
  const particle = useRef<HTMLSpanElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState(() => ({ seconds: 0, journey: journeyAt(0), wait: 0 }));
  const [temporary, setTemporary] = useState(false);
  const [confirmedDeparture, setConfirmedDeparture] = useState<ReturnType<typeof persistResetDeparture>>(null);
  const [resetError, setResetError] = useState(false);

  useLayoutEffect(() => {
    const title = document.title;
    document.title = "우주의 시계 | 50091";
    const departure = confirmedDeparture ?? selectDeparture(storage, Date.now(), memoryDeparture);
    memoryDeparture = departure.saved ? undefined : departure.at;
    setTemporary(!departure.saved);

    // The frame loop refreshes these counters without re-rendering the slower summaries.
    const counters = distanceSpecs.map(spec => {
      const element = page.current!.querySelector<HTMLElement>(`[data-distance="${spec.id}"]`)!;
      return {
        speed: spec.speed, decimals: "decimals" in spec ? spec.decimals : 0, element,
        value: element.querySelector(".cosmic-value")!,
        unit: element.querySelector(".cosmic-unit")!,
      };
    });
    const particleStyle = particle.current!.style;
    const milestones = milestonesAtDeparture(departure.at);
    let journey = journeyAt(0, milestones), lastSecond = -1, lastWait = -1;
    let segment = journeySegment(journey), lastProgress = -1;
    let showDeparture = confirmedDeparture !== null;
    const stop = startCosmicUpdates(departure.at, {
      wallNow: Date.now,
      monotonicNow: () => performance.now(),
      visible: () => !document.hidden,
      subscribe(sync) {
        document.addEventListener("visibilitychange", sync);
        window.addEventListener("pageshow", sync);
        return () => {
          document.removeEventListener("visibilitychange", sync);
          window.removeEventListener("pageshow", sync);
        };
      },
      requestFrame: callback => window.requestAnimationFrame(callback),
      cancelFrame: frame => window.cancelAnimationFrame(frame),
    }, sinceDeparture => {
      const elapsed = showDeparture ? 0 : sinceDeparture;
      showDeparture = false;
      for (const counter of counters) {
        const { value, unit, long } = formatDistance(elapsed, counter.speed, counter.decimals);
        if (counter.value.textContent !== value) counter.value.textContent = value;
        if (counter.unit.textContent !== unit) counter.unit.textContent = unit;
        if (counter.element.hasAttribute("data-long") !== long) counter.element.toggleAttribute("data-long", long);
      }

      const km = elapsed * LIGHT_KM_S;
      const crossed = !!journey.next && km >= journey.next.km;
      if (crossed) {
        journey = journeyAt(km, milestones);
        segment = journeySegment(journey);
      }
      const progress = journeyProgress(km, segment.start.km, segment.end.km);
      if (progress !== lastProgress) {
        lastProgress = progress;
        particleStyle.translate = `${progress * 100}cqi`;
      }
      const seconds = Math.floor(elapsed);
      const wait = journey.next ? Math.max(0, (journey.next.km - km) / LIGHT_KM_S) : 0;
      const waitSecond = Math.floor(wait);
      if (crossed || lastSecond !== seconds || lastWait !== waitSecond) {
        lastSecond = seconds;
        lastWait = waitSecond;
        setView({ seconds, journey, wait });
      }
    });
    return () => { stop(); document.title = title; };
  }, [confirmedDeparture]);

  function confirmReset(event: FormEvent<HTMLFormElement>) {
    if ((event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") !== "reset") return;
    const departure = persistResetDeparture(storage, Date.now());
    if (!departure) {
      event.preventDefault();
      setResetError(true);
      return;
    }
    setConfirmedDeparture(departure);
  }

  const { start, end } = journeySegment(view.journey);
  const { next } = view.journey;
  return (
    <main className="workspace cosmic-page" ref={page}>
      <h1 className="sr-only">우주의 시계</h1>
      <section className="cosmic-elapsed" aria-labelledby="cosmic-time-heading">
        <h2 id="cosmic-time-heading">첫 방문부터 흐른 시간</h2>
        <Duration seconds={view.seconds} />
      </section>

      <section className="cosmic-light" aria-labelledby="cosmic-light-heading">
        <h2 id="cosmic-light-heading">지구에서 출발한 빛</h2>
        <p className="cosmic-light-total"><Distance id="light" /></p>
        <div className="cosmic-journey">
          <div className="cosmic-journey-track" style={milestoneLineStyle(start.id, end.id)} aria-hidden="true">
            <span className="cosmic-journey-particle" ref={particle}>
              <span className="cosmic-journey-spark" />
            </span>
          </div>
          <div className="cosmic-journey-stop cosmic-journey-start">
            <MilestoneSymbol id={start.id} />
            <span><span className="sr-only">지난 지점: </span>{start.name}</span>
          </div>
          <div className="cosmic-journey-stop cosmic-journey-end">
            <MilestoneSymbol id={end.id} />
            <span><span className="sr-only">{next ? "다음 지점: " : "마지막 지점: "}</span>{end.name}</span>
          </div>
        </div>
        {next && (
          <dl className="cosmic-countdown">
            <dt>다음 지점까지</dt>
            <dd>{remainingText(view.wait)}</dd>
          </dl>
        )}
      </section>

      <section className="cosmic-motion" aria-labelledby="cosmic-motion-heading">
        <h2 className="home-group-heading cosmic-motion-heading" id="cosmic-motion-heading">이동 거리</h2>
        <dl className="cosmic-motion-list">
          {MOTIONS.map(motion => (
            <div key={motion.id} className="cosmic-motion-row">
              <dt>{motion.name}</dt>
              <dd><Distance id={motion.id} /></dd>
            </div>
          ))}
        </dl>
      </section>

      <button className="cosmic-reset" type="button" aria-haspopup="dialog" onClick={() => {
        setResetError(false);
        resetDialog.current?.showModal();
      }}>
        <RotateCcw aria-hidden="true" size={13} />
        초기화
      </button>

      {temporary && <p className="cosmic-note">이 브라우저에서는 첫 방문 시각을 저장할 수 없어요.</p>}

      <dialog className="cosmic-reset-dialog" ref={resetDialog} aria-labelledby="cosmic-reset-title" aria-describedby="cosmic-reset-description">
        <h1 id="cosmic-reset-title">우주의 시계를 초기화할까요?</h1>
        <p id="cosmic-reset-description">지금까지 누적된 시간과 이동 거리가 모두 초기화됩니다. 이전 기록은 복구할 수 없습니다.</p>
        <form method="dialog" onSubmit={confirmReset}>
          <div className="cosmic-reset-actions">
            <button className="tool-button" type="submit" value="cancel" autoFocus>취소</button>
            <button className="tool-button cosmic-reset-confirm" type="submit" value="reset">초기화</button>
          </div>
          <p className="cosmic-reset-error" role="alert">{resetError && "새 출발 시각을 저장하지 못했어요. 기존 기록은 그대로예요."}</p>
        </form>
      </dialog>
    </main>
  );
}
