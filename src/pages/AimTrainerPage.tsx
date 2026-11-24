import { Crosshair, Pause, Play, Settings2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AimOptionsPanel } from "../features/aim/components/AimOptionsPanel";
import { AimTopHud } from "../features/aim/components/AimTopHud";
import { AimTrainerCanvas } from "../features/aim/components/AimTrainerCanvas";
import {
  MAX_TARGET_DURATION_MS,
  MIN_TARGET_DURATION_MS,
  TARGET_DURATION_STEP_MS,
  TOTAL_TARGETS,
} from "../features/aim/constants";
import type {
  TargetSizeMultiplier,
  TargetStyleKey,
} from "../features/aim/store/useAimStore";
import { useAimStore } from "../features/aim/store/useAimStore";

type AimTrainerPageProps = {
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

export function AimTrainerPage({ theme }: AimTrainerPageProps) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
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
  const remainingTargets = Math.max(0, TOTAL_TARGETS - (score + misses));
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
      const nextWidth = Math.max(1, Math.floor(root.clientWidth));
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

  const canConfigure = gameState === "idle" || gameState === "finished";

  return (
    <main className="workspace tool-workspace">
      <h1 className="sr-only">에임 훈련장</h1>

      <section className="aim-console" aria-label="에임 훈련">
        <header className="aim-toolbar">
          <AimTopHud scoreText={scoreText} remainingText={remainingText} targetDuration={targetDuration} />
          {gameState === "playing" && (
            <button type="button" className="tool-button" onClick={pauseGame}>
              <Pause size={15} aria-hidden="true" /> 일시정지
            </button>
          )}
          {canConfigure && (
            <button
              type="button"
              ref={settingsButtonRef}
              className="tool-button"
              onClick={() => setIsOptionOpen((prev) => !prev)}
              aria-expanded={isOptionOpen}
              aria-controls="aim-settings"
            >
              <Settings2 size={15} aria-hidden="true" /> 과녁 설정
            </button>
          )}
        </header>

        <div id="aim-settings" hidden={!canConfigure || !isOptionOpen}>
          {canConfigure && isOptionOpen && (
            <AimOptionsPanel
              targetStyle={targetStyle}
              targetDuration={targetDuration}
              targetSizeMultiplier={targetSizeMultiplier}
              targetStyleOptions={TARGET_STYLE_OPTIONS}
              targetSizeOptions={TARGET_SIZE_OPTIONS}
              minDuration={MIN_TARGET_DURATION_MS}
              maxDuration={MAX_TARGET_DURATION_MS}
              stepDuration={TARGET_DURATION_STEP_MS}
              onSelectStyle={(style) => {
                setTargetStyle(style);
                setIsOptionOpen(false);
                settingsButtonRef.current?.focus();
              }}
              onSelectSize={setTargetSizeMultiplier}
              onSelectDuration={setTargetLifetimeMs}
            />
          )}
        </div>

        <div ref={arenaRef} className="aim-arena">
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
          {gameState === "paused" && (
            <div className="aim-overlay">
              <h2>일시정지</h2>
              <div className="aim-overlay-actions">
                <button type="button" className="tool-button is-primary" onClick={resumeGame}>계속하기</button>
                <button type="button" className="tool-button" onClick={() => startGame()}>새 게임</button>
                <button type="button" className="tool-button" onClick={resetGame}>훈련 메뉴</button>
              </div>
            </div>
          )}
          {canConfigure && (
            <div className="aim-overlay">
              {gameState === "idle" ? (
                <div className="aim-mascot" aria-hidden="true">
                  <img
                    src={`${import.meta.env.BASE_URL}img/penguin2.png`}
                    alt=""
                    width={1600}
                    height={1600}
                    decoding="async"
                  />
                </div>
              ) : (
                <Crosshair size={52} strokeWidth={1.5} className="aim-overlay-reticle" aria-hidden="true" />
              )}
              <button type="button" className="tool-button is-primary" onClick={() => startGame()}>
                <Play size={16} fill="currentColor" aria-hidden="true" />
                {gameState === "finished" ? "다시 시작" : "훈련 시작"}
              </button>
            </div>
          )}
        </div>

        <details className="aim-credits">
          <summary>사운드 출처</summary>
          <div className="aim-credit-inline">
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
        </details>
      </section>
    </main>
  );
}
