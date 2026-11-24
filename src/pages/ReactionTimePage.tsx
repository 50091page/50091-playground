import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ATTEMPT_COUNT, createReactionSession, type InputKind, type Phase, type ReactionSummary } from "../features/reaction/session";
import { safeLocalStorageGet, safeLocalStorageSet } from "../utils/storage";
import "../styles/reaction-time.css";

const MESSAGES: Record<Phase, [string, string]> = {
  idle: ["반응속도 테스트", "화면을 눌러 시작"],
  waiting: ["기다리세요", "초록색으로 바뀌면 누르세요"],
  ready: ["지금 누르세요", ""],
  result: ["", "화면을 눌러 계속"],
  "too-early": ["너무 빨랐어요", "화면을 눌러 다시 시도"],
  interrupted: ["이번 시도는 기록하지 않았어요", "화면을 눌러 다시 시도"],
  completed: ["", ""],
};

function saveBest(kind: InputKind, average: number) {
  const key = `soopi-utils.reaction.best.${kind}`;
  const previous = Number(safeLocalStorageGet(key));
  const best = Number.isFinite(previous) && previous > 0 ? Math.min(average, previous) : average;
  const isNew = best !== previous;
  if (isNew) safeLocalStorageSet(key, String(best));
  return { time: best, isNew };
}

function milliseconds(value: number) {
  return `${Math.round(value)} ms`;
}

function ResultTime({ time }: { time: number }) {
  return (
    <span className="reaction-time-value">
      <span className="reaction-time-number">{Math.round(time)}</span>{" "}
      <span className="reaction-time-unit">ms</span>
    </span>
  );
}

export function ReactionTimePage() {
  const surfaceRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const sessionRef = useRef<ReturnType<typeof createReactionSession> | null>(null);
  const restoreFocus = useRef(false);
  const [completion, setCompletion] = useState<ReactionSummary | null>(null);
  const [best, setBest] = useState<ReturnType<typeof saveBest> | null>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current!;
    const label = labelRef.current!;
    const hint = hintRef.current!;
    const progress = progressRef.current!;
    let resultFrame: number | undefined;
    const session = createReactionSession({
      now: () => performance.now(),
      timeOrigin: performance.timeOrigin,
      random: Math.random,
      available: () => !document.hidden && document.hasFocus(),
      setTimer: (fn, delay) => window.setTimeout(fn, delay),
      clearTimer: (id) => window.clearTimeout(id),
      requestFrame: (fn) => window.requestAnimationFrame(fn),
      cancelFrame: (id) => window.cancelAnimationFrame(id),
      onView: ({ phase, count, latest, interruption }) => {
        const [title, detail] = MESSAGES[phase];
        if (phase !== "ready") progress.textContent = `${count} / ${ATTEMPT_COUNT}`;
        label.textContent = (phase === "result" || phase === "completed") && latest !== undefined ? milliseconds(latest) : title;
        hint.textContent = interruption === "focus" ? "화면을 벗어났어요. 눌러서 다시 시도" : detail;
        surface.dataset.phase = phase;
      },
      onComplete: (summary) => {
        // Let the final input finish dispatching before mounting and focusing the summary.
        resultFrame = window.requestAnimationFrame(() => {
          resultFrame = undefined;
          setCompletion(summary);
        });
      },
    });
    sessionRef.current = session;

    const onPointerDown = (event: PointerEvent) => {
      const handledAt = performance.now();
      if (!event.isTrusted || !event.isPrimary || event.button !== 0) return;
      const kind = event.pointerType;
      if (kind !== "mouse" && kind !== "touch" && kind !== "pen") return;
      session.input({ stamp: event.timeStamp, kind, x: event.clientX, y: event.clientY }, handledAt);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const handledAt = performance.now();
      if (!event.isTrusted || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      if (!event.repeat) session.input({ stamp: event.timeStamp, kind: "keyboard", x: 0, y: 0 }, handledAt);
    };
    const onVisibility = () => {
      if (document.hidden) session.interrupt();
    };
    surface.addEventListener("pointerdown", onPointerDown, { passive: true });
    surface.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", session.interrupt);
    window.addEventListener("pagehide", session.interrupt);
    return () => {
      session.dispose();
      if (resultFrame !== undefined) window.cancelAnimationFrame(resultFrame);
      sessionRef.current = null;
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", session.interrupt);
      window.removeEventListener("pagehide", session.interrupt);
    };
  }, []);

  useLayoutEffect(() => {
    if (completion) retryRef.current?.focus({ preventScroll: true });
    else if (restoreFocus.current) {
      restoreFocus.current = false;
      surfaceRef.current?.focus({ preventScroll: true });
    }
  }, [completion]);

  useEffect(() => {
    if (completion && completion.kind !== "mixed") setBest(saveBest(completion.kind, completion.average));
  }, [completion]);

  return (
    <main className="workspace tool-workspace reaction-workspace">
      <h1 className="sr-only">반응속도 테스트</h1>
      <div className="reaction-board">
        <button
          ref={surfaceRef}
          type="button"
          className="reaction-surface"
          hidden={completion !== null}
          aria-label="반응속도 테스트 영역"
          aria-describedby="reaction-cue"
        >
          <span className="reaction-progress" ref={progressRef} aria-label="완료한 시도" />
          <span className="reaction-cue" id="reaction-cue" aria-live="polite" aria-atomic="true">
            <span className="reaction-label" ref={labelRef} />
            <span className="reaction-hint" ref={hintRef} />
          </span>
        </button>
        {completion && (
          <section className="reaction-summary" aria-label="측정 결과">
            <div className="reaction-summary-content">
              <div className="reaction-average">
                <h2>평균 반응속도</h2>
                <ResultTime time={completion.average} />
                <div className="reaction-summary-meta">
                  <p role="status">
                    {completion.kind === "mixed" ? "혼합 입력 · 최고 기록 미반영" : best?.isNew
                      ? "최고 기록 갱신!"
                      : best && `내 최고 기록 · ${milliseconds(best.time)}`}
                  </p>
                  <p>조기 클릭 {completion.falseStarts}회</p>
                </div>
              </div>
              <ol className="reaction-attempts" aria-label="시도별 기록" role="list">
                {completion.times.map((time, index) => (
                  <li
                    key={index}
                    className={time === completion.fastest ? "is-fastest" : time === completion.slowest ? "is-slowest" : undefined}
                  >
                    <span className="reaction-attempt-index">{index + 1}회</span>
                    <ResultTime time={time} />
                  </li>
                ))}
              </ol>
              <button ref={retryRef} type="button" className="tool-button is-primary" onClick={() => {
                sessionRef.current?.reset();
                restoreFocus.current = true;
                setBest(null);
                setCompletion(null);
              }}>다시 시작</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
