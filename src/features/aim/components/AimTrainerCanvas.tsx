import { Container, Graphics, Stage } from "@pixi/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FederatedPointerEvent, Graphics as PixiGraphics, Rectangle } from "pixi.js";
import { MISS_FADE_DURATION_MS, SPAWN_DURATION_MS, TARGET_RADIUS, TOTAL_TARGETS } from "../constants";
import type { AimGameState, TargetSizeMultiplier, TargetStyleKey } from "../store/useAimStore";

type AimTrainerCanvasProps = {
  width: number;
  height: number;
  isDarkMode: boolean;
  gameState: AimGameState;
  targetDuration: number;
  targetSizeMultiplier: TargetSizeMultiplier;
  targetStyle: TargetStyleKey;
  onHit: () => void;
  onOffTargetClick: () => void;
  onMiss: () => void;
  onComplete: () => void;
};

type TargetPhase = "spawning" | "active" | "hit" | "miss";

type TargetEntity = {
  id: number;
  x: number;
  y: number;
  radius: number;
  spawnedAt: number;
  phase: TargetPhase;
  phaseAt: number;
  wasHit: boolean;
};

const TARGET_STYLE_COLORS: Record<TargetStyleKey, { inner: number; mid: number; outer: number }> = {
  ember: { inner: 0xff5c79, mid: 0xffc7d4, outer: 0xfff3f8 },
  mint: { inner: 0x34d399, mid: 0xb7f7dd, outer: 0xecfff7 },
  violet: { inner: 0xa78bfa, mid: 0xded4ff, outer: 0xf4f0ff },
  sunset: { inner: 0xfb923c, mid: 0xffd5a8, outer: 0xfff4e7 },
  frost: { inner: 0x60a5fa, mid: 0xc6e0ff, outer: 0xf1f8ff },
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeOutBack(progress: number) {
  const p = clamp01(progress);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

function createTarget(nowMs: number, width: number, height: number, sizeMultiplier: TargetSizeMultiplier): TargetEntity {
  const margin = 64;
  const minX = margin;
  const maxX = Math.max(minX + 1, width - margin);
  const minY = margin + 28;
  const maxY = Math.max(minY + 1, height - margin);
  const x = minX + Math.random() * (maxX - minX);
  const y = minY + Math.random() * (maxY - minY);

  return {
    id: Math.floor(nowMs) + Math.floor(Math.random() * 10_000),
    x,
    y,
    radius: TARGET_RADIUS * sizeMultiplier,
    spawnedAt: nowMs,
    phase: "spawning",
    phaseAt: nowMs,
    wasHit: false,
  };
}

export function AimTrainerCanvas({
  width,
  height,
  isDarkMode,
  gameState,
  targetDuration,
  targetSizeMultiplier,
  targetStyle,
  onHit,
  onOffTargetClick,
  onMiss,
  onComplete,
}: AimTrainerCanvasProps) {
  const [clockMs, setClockMs] = useState(0);
  const [target, setTarget] = useState<TargetEntity | null>(null);

  const targetRef = useRef<TargetEntity | null>(null);
  const resolvedRef = useRef(0);
  const nextSpawnAtRef = useRef(0);
  const completedRef = useRef(false);
  const targetDurationRef = useRef(targetDuration);
  const previousGameStateRef = useRef<AimGameState>("idle");
  const pausedAtRef = useRef<number | null>(null);
  const hitArea = useMemo(() => new Rectangle(0, 0, width, height), [width, height]);

  targetDurationRef.current = targetDuration;

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const prevGameState = previousGameStateRef.current;
    previousGameStateRef.current = gameState;

    if (gameState === "paused") {
      if (prevGameState === "playing") {
        pausedAtRef.current = performance.now();
      }
      return;
    }

    if (gameState === "playing" && prevGameState === "paused") {
      const pausedAt = pausedAtRef.current;
      if (!pausedAt) {
        return;
      }
      const now = performance.now();
      const pauseDelta = now - pausedAt;
      pausedAtRef.current = null;

      const current = targetRef.current;
      if (current) {
        const resumed = {
          ...current,
          spawnedAt: current.spawnedAt + pauseDelta,
          phaseAt: current.phaseAt + pauseDelta,
        };
        targetRef.current = resumed;
        setTarget(resumed);
      }
      if (nextSpawnAtRef.current > 0) {
        nextSpawnAtRef.current += pauseDelta;
      }
      return;
    }

    if (gameState !== "playing") {
      targetRef.current = null;
      resolvedRef.current = 0;
      nextSpawnAtRef.current = 0;
      completedRef.current = false;
      pausedAtRef.current = null;
      setTarget(null);
      return;
    }

    const now = performance.now();
    const initialTarget = createTarget(now, width, height, targetSizeMultiplier);
    targetRef.current = initialTarget;
    resolvedRef.current = 0;
    nextSpawnAtRef.current = 0;
    completedRef.current = false;
    setTarget(initialTarget);
  }, [gameState, height, targetSizeMultiplier, width]);

  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    let frameId = 0;

    const loop = (nowMs: number) => {
      if (!completedRef.current) {
        const current = targetRef.current;
        const isAnimating = current
          ? current.phase === "spawning" || current.phase === "hit" || current.phase === "miss"
          : false;
        if (isAnimating) {
          setClockMs(nowMs);
        }

        if (current) {
          const visibleEndAt = current.spawnedAt + targetDurationRef.current;
          const nextSpawnAt = current.spawnedAt + targetDurationRef.current * 2;
          const ageMs = nowMs - current.spawnedAt;
          const phaseAgeMs = nowMs - current.phaseAt;

          if (current.phase === "spawning" && ageMs >= SPAWN_DURATION_MS) {
            const next = { ...current, phase: "active" as const, phaseAt: nowMs };
            targetRef.current = next;
            setTarget(next);
          }

          if (
            current.phase === "active" &&
            !current.wasHit &&
            nowMs >= Math.max(current.spawnedAt + SPAWN_DURATION_MS, visibleEndAt - MISS_FADE_DURATION_MS)
          ) {
            const next = { ...current, phase: "miss" as const, phaseAt: nowMs };
            targetRef.current = next;
            setTarget(next);
          }

          const shouldResolveByHit = current.phase === "hit" && phaseAgeMs >= MISS_FADE_DURATION_MS;
          const shouldResolveByTimeout = nowMs >= visibleEndAt;

          if (shouldResolveByHit || shouldResolveByTimeout) {
            if (!current.wasHit && shouldResolveByTimeout) {
              onMiss();
            }

            resolvedRef.current += 1;
            targetRef.current = null;
            setTarget(null);
            nextSpawnAtRef.current = nextSpawnAt;

            if (resolvedRef.current >= TOTAL_TARGETS) {
              completedRef.current = true;
              onComplete();
            }
          }
        } else if (resolvedRef.current < TOTAL_TARGETS && nowMs >= nextSpawnAtRef.current) {
          const nextTarget = createTarget(nowMs, width, height, targetSizeMultiplier);
          targetRef.current = nextTarget;
          nextSpawnAtRef.current = nextTarget.spawnedAt + targetDurationRef.current * 2;
          setTarget(nextTarget);
        }
      }

      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frameId);
  }, [gameState, height, onComplete, onMiss, targetSizeMultiplier, width]);

  const drawArena = useCallback(
    (graphics: PixiGraphics) => {
      const fillColor = isDarkMode ? 0x202a3c : 0xe8eef8;
      const fillAlpha = isDarkMode ? 0.92 : 0.94;
      const gridColor = isDarkMode ? 0x394861 : 0xc4d2e8;
      const gridAlpha = isDarkMode ? 0.8 : 0.62;

      graphics.clear();
      graphics.beginFill(fillColor, fillAlpha);
      graphics.drawRoundedRect(0, 0, width, height, 18);
      graphics.endFill();

      graphics.lineStyle(1, gridColor, gridAlpha);
      const step = 42;
      for (let x = step; x < width; x += step) {
        graphics.moveTo(x, 0);
        graphics.lineTo(x, height);
      }
      for (let y = step; y < height; y += step) {
        graphics.moveTo(0, y);
        graphics.lineTo(width, y);
      }
    },
    [height, isDarkMode, width]
  );

  const targetVisual = useMemo(() => {
    if (!target) {
      return null;
    }

    const lifeMs = clockMs - target.spawnedAt;
    const phaseMs = clockMs - target.phaseAt;
    const palette = TARGET_STYLE_COLORS[targetStyle];

    if (target.phase === "spawning") {
      const progress = clamp01(lifeMs / SPAWN_DURATION_MS);
      return {
        scale: 0.15 + easeOutBack(progress) * 0.85,
        alpha: 0.55 + progress * 0.45,
        innerColor: palette.inner,
        midColor: palette.mid,
        outerColor: palette.outer,
      };
    }

    if (target.phase === "hit") {
      const progress = clamp01(phaseMs / MISS_FADE_DURATION_MS);
      return {
        scale: 1 + progress * 0.1,
        alpha: 1 - progress * 0.92,
        innerColor: 0x94a3b8,
        midColor: 0xcbd5e1,
        outerColor: 0xe2e8f0,
      };
    }

    if (target.phase === "miss") {
      const progress = clamp01(phaseMs / MISS_FADE_DURATION_MS);
      return {
        scale: 1 + progress * 0.1,
        alpha: 1 - progress * 0.92,
        innerColor: 0x94a3b8,
        midColor: 0xcbd5e1,
        outerColor: 0xe2e8f0,
      };
    }

    return {
      scale: 1,
      alpha: 1,
      innerColor: palette.inner,
      midColor: palette.mid,
      outerColor: palette.outer,
    };
  }, [clockMs, target, targetStyle]);

  const onPointerDown = (event: FederatedPointerEvent) => {
    if (gameState !== "playing") {
      return;
    }

    const current = targetRef.current;
    if (!current || current.phase === "hit" || current.phase === "miss") {
      onOffTargetClick();
      return;
    }

    const dx = event.global.x - current.x;
    const dy = event.global.y - current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hitRange = current.radius * 1.166;

    if (distance <= hitRange) {
      const hitNowMs = performance.now();
      onHit();
      const next = {
        ...current,
        phase: "hit" as const,
        phaseAt: hitNowMs,
        wasHit: true,
      };
      setClockMs(hitNowMs);
      targetRef.current = next;
      setTarget(next);
    } else {
      onOffTargetClick();
    }
  };

  return (
    <div className="aim-arena-canvas">
      <Stage width={width} height={height} options={{ antialias: true, backgroundAlpha: 0 }}>
        <Graphics
          draw={drawArena}
        />

        <Container interactive={true} hitArea={hitArea} pointerdown={onPointerDown} />

        {target && targetVisual ? (
          <Container x={target.x} y={target.y} scale={targetVisual.scale} alpha={targetVisual.alpha}>
            <Graphics
              draw={(graphics) => {
                graphics.clear();
                graphics.beginFill(targetVisual.outerColor, 0.14);
                graphics.drawCircle(0, 0, target.radius + 8);
                graphics.endFill();

                graphics.beginFill(targetVisual.outerColor, 0.26);
                graphics.drawCircle(0, 0, target.radius + 4);
                graphics.endFill();

                graphics.beginFill(targetVisual.midColor, 0.95);
                graphics.drawCircle(0, 0, target.radius);
                graphics.endFill();

                graphics.beginFill(targetVisual.innerColor, 0.92);
                graphics.drawCircle(0, 0, target.radius * 0.55);
                graphics.endFill();
              }}
            />
          </Container>
        ) : null}
      </Stage>
    </div>
  );
}
