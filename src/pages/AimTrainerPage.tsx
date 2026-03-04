import { useCallback, useEffect, useRef, useState } from "react";
import { BackToMenuButton } from "../components/BackToMenuButton";
import { AimTrainerCanvas } from "../features/aim/components/AimTrainerCanvas";
import type {
  TargetLifetimeMs,
  TargetSizeMultiplier,
  TargetStyleKey,
} from "../features/aim/store/useAimStore";
import { useAimStore } from "../features/aim/store/useAimStore";

type AimTrainerPageProps = {
  onNavigateMenu: () => void;
  theme: "light" | "dark";
};

const TARGET_STYLE_OPTIONS: Array<{ key: TargetStyleKey; label: string; swatch: string }> = [
  { key: "ember", label: "Ember", swatch: "linear-gradient(135deg, #ff5c79, #ffc7d4)" },
  { key: "mint", label: "Mint", swatch: "linear-gradient(135deg, #34d399, #b7f7dd)" },
  { key: "violet", label: "Violet", swatch: "linear-gradient(135deg, #a78bfa, #ded4ff)" },
  { key: "sunset", label: "Sunset", swatch: "linear-gradient(135deg, #fb923c, #ffd5a8)" },
  { key: "frost", label: "Frost", swatch: "linear-gradient(135deg, #60a5fa, #c6e0ff)" },
];
const TARGET_SIZE_OPTIONS: Array<{ value: TargetSizeMultiplier; label: string; previewPx: number }> = [
  { value: 0.5, label: "0.5x", previewPx: 10 },
  { value: 1, label: "1.0x", previewPx: 16 },
  { value: 1.5, label: "1.5x", previewPx: 22 },
  { value: 2, label: "2.0x", previewPx: 28 },
];
const MIN_FADE_SPEED_MS = 500;
const MAX_FADE_SPEED_MS = 1000;
const FADE_SPEED_STEP_MS = 50;

export function AimTrainerPage({ onNavigateMenu, theme }: AimTrainerPageProps) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const hitAudioRef = useRef<HTMLAudioElement | null>(null);
  const missAudioRef = useRef<HTMLAudioElement | null>(null);
  const [arenaSize, setArenaSize] = useState({ width: 920, height: 520 });
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const score = useAimStore((state) => state.score);
  const misses = useAimStore((state) => state.misses);
  const gameState = useAimStore((state) => state.gameState);
  const targetDuration = useAimStore((state) => state.targetDuration);
  const targetStyle = useAimStore((state) => state.targetStyle);
  const targetSizeMultiplier = useAimStore((state) => state.targetSizeMultiplier);
  const startGame = useAimStore((state) => state.startGame);
  const pauseGame = useAimStore((state) => state.pauseGame);
  const resumeGame = useAimStore((state) => state.resumeGame);
  const finishGame = useAimStore((state) => state.finishGame);
  const registerHit = useAimStore((state) => state.registerHit);
  const registerOffTargetClick = useAimStore((state) => state.registerOffTargetClick);
  const registerMiss = useAimStore((state) => state.registerMiss);
  const setTargetStyle = useAimStore((state) => state.setTargetStyle);
  const setTargetSizeMultiplier = useAimStore((state) => state.setTargetSizeMultiplier);
  const setTargetLifetimeMs = useAimStore((state) => state.setTargetLifetimeMs);
  const resetGame = useAimStore((state) => state.resetGame);
  const remainingTargets = Math.max(0, 30 - (score + misses));
  const scoreText = String(score).padStart(2, "0");
  const remainingText = String(remainingTargets).padStart(2, "0");

  const handleHit = useCallback(() => {
    registerHit();
    const audio = hitAudioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [registerHit]);

  const handleOffTargetClick = useCallback(() => {
    registerOffTargetClick();
    const audio = missAudioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [registerOffTargetClick]);

  useEffect(() => {
    const root = arenaRef.current;
    if (!root) {
      return;
    }

    const measure = () => {
      const nextWidth = Math.max(320, Math.floor(root.clientWidth));
      const nextHeight = Math.max(320, Math.min(560, Math.floor(nextWidth * 0.56)));
      setArenaSize({ width: nextWidth, height: nextHeight });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hitAudio = new Audio("/sound/hit.wav");
    hitAudio.preload = "auto";
    const missAudio = new Audio("/sound/miss.wav");
    missAudio.preload = "auto";
    hitAudioRef.current = hitAudio;
    missAudioRef.current = missAudio;
    return () => {
      hitAudio.pause();
      missAudio.pause();
      hitAudioRef.current = null;
      missAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gameState === "playing" || gameState === "paused") {
      setIsOptionOpen(false);
    }
  }, [gameState]);

  useEffect(() => {
    return () => {
      resetGame();
    };
  }, [resetGame]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (gameState === "playing") {
        event.preventDefault();
        pauseGame();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameState, pauseGame]);

  return (
    <section className="mx-auto max-w-[1120px] px-3 py-2">
      <div className="menu-card menu-card-active menu-card-tone-aim">
        <div ref={arenaRef} className="relative mt-3 w-full">
          <AimTrainerCanvas
            width={arenaSize.width}
            height={arenaSize.height}
            isDarkMode={theme === "dark"}
            gameState={gameState}
            targetDuration={targetDuration}
            targetSizeMultiplier={targetSizeMultiplier}
            targetStyle={targetStyle}
            onHit={handleHit}
            onOffTargetClick={handleOffTargetClick}
            onMiss={registerMiss}
            onComplete={finishGame}
          />
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2">
            <div className="aim-top-scoreboard">
              <p className="aim-top-scoreboard-item">
                <span className="aim-top-scoreboard-label">점수</span>
                <span className="aim-top-scoreboard-value">{scoreText}</span>
              </p>
              <p className="aim-top-scoreboard-item">
                <span className="aim-top-scoreboard-label">남음</span>
                <span className="aim-top-scoreboard-value">{remainingText}</span>
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3">
            <span className="aim-speed-chip">{targetDuration}ms</span>
          </div>
          {gameState === "playing" ? (
            <div className="absolute left-3 top-3">
              <button
                type="button"
                className="pointer-events-auto aim-pause-button"
                onClick={pauseGame}
                aria-label="일시정지"
              >
                일시정지
              </button>
            </div>
          ) : null}
          {gameState === "paused" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="aim-arena-idle-overlay" />
              <div className="pointer-events-auto aim-pause-panel relative z-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  className="aim-arena-start-button is-pause-new min-w-[132px]"
                  onClick={() => startGame()}
                >
                  NEW GAME
                </button>
                <button
                  type="button"
                  className="aim-arena-start-button is-pause-menu min-w-[132px]"
                  onClick={onNavigateMenu}
                >
                  MENU
                </button>
                <button
                  type="button"
                  className="aim-arena-start-button is-pause-resume min-w-[132px]"
                  onClick={resumeGame}
                >
                  RESUME
                </button>
              </div>
            </div>
          ) : null}
          {gameState === "idle" || gameState === "finished" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="aim-arena-idle-overlay" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="pointer-events-auto aim-arena-start-button is-start"
                    onClick={() => {
                      setIsOptionOpen(false);
                      startGame();
                    }}
                    aria-label="게임 시작"
                  >
                    {gameState === "finished" ? "RESTART" : "START"}
                  </button>
                  <button
                    type="button"
                    className="pointer-events-auto aim-arena-start-button is-option"
                    onClick={() => setIsOptionOpen((prev) => !prev)}
                    aria-expanded={isOptionOpen}
                    aria-label="과녁 스타일 옵션 열기"
                  >
                    OPTION
                  </button>
                </div>
                {isOptionOpen ? (
                  <div className="pointer-events-auto aim-style-picker">
                    <p className="aim-style-picker-title">Target Style</p>
                    {TARGET_STYLE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.key}
                        className={`aim-style-option${targetStyle === option.key ? " is-selected" : ""}`}
                        onClick={() => {
                          setTargetStyle(option.key);
                          setIsOptionOpen(false);
                        }}
                        role="option"
                        aria-selected={targetStyle === option.key}
                      >
                        <span className="aim-style-option-swatch" style={{ background: option.swatch }} />
                        <span>{option.label}</span>
                      </button>
                    ))}

                    <p className="aim-style-picker-title is-section-gap">Target Size</p>
                    <div className="aim-option-row" role="listbox" aria-label="타겟 크기 선택">
                      {TARGET_SIZE_OPTIONS.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          className={`aim-size-option${
                            targetSizeMultiplier === option.value ? " is-selected" : ""
                          }`}
                          onClick={() => setTargetSizeMultiplier(option.value)}
                          role="option"
                          aria-selected={targetSizeMultiplier === option.value}
                        >
                          <span
                            className="aim-size-option-preview"
                            style={{ width: `${option.previewPx}px`, height: `${option.previewPx}px` }}
                            aria-hidden="true"
                          />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>

                    <p className="aim-style-picker-title is-section-gap">Fade Speed</p>
                    <div className="aim-fade-slider-wrap">
                      <input
                        type="range"
                        min={MIN_FADE_SPEED_MS}
                        max={MAX_FADE_SPEED_MS}
                        step={FADE_SPEED_STEP_MS}
                        value={targetDuration}
                        className="aim-fade-slider"
                        onChange={(event) =>
                          setTargetLifetimeMs(Number(event.currentTarget.value) as TargetLifetimeMs)
                        }
                        aria-label="타겟 사라지는 속도"
                      />
                      <span className="aim-fade-slider-value">{targetDuration}ms</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="aim-credit-inline">
            <p className="aim-credit-label m-0">Audio credit</p>
            <p className="m-0">
              <span>Woodblock.wav by kwahmah_02 · </span>
              <a href="https://freesound.org/s/268822/" target="_blank" rel="noreferrer">
                Source
              </a>
              <span> · </span>
              <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
                CC BY 3.0
              </a>
            </p>
            <p className="m-0">
              <span>doyng_G_1.R.aif by batchku · </span>
              <a href="https://freesound.org/s/10884/" target="_blank" rel="noreferrer">
                Source
              </a>
              <span> · </span>
              <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">
                CC0
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-start">
        <BackToMenuButton onClick={onNavigateMenu} />
      </div>
    </section>
  );
}
