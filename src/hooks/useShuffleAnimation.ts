import { useEffect, useRef, useState } from "react";
import type { RowPair } from "../types/swap.js";

type StartShuffleAnimationOptions = {
  baseValues: RowPair[];
  baseLocks: boolean[];
  finalValues: RowPair[];
  durationMs: number;
  onFinish: (finalValues: RowPair[]) => void;
};

const PREVIEW_INTERVAL_MS = 40;

export function useShuffleAnimation() {
  const [isShuffling, setIsShuffling] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<RowPair[] | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isShufflingRef = useRef(false);

  const stopShuffleAnimation = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopShuffleAnimation();
      isShufflingRef.current = false;
    };
  }, []);

  const finishShuffleAnimation = (finalValues: RowPair[], onFinish: (nextValues: RowPair[]) => void) => {
    stopShuffleAnimation();
    setAnimatedValues(null);
    setIsShuffling(false);
    isShufflingRef.current = false;
    onFinish(finalValues);
  };

  const startShuffleAnimation = ({
    baseValues,
    baseLocks,
    finalValues,
    durationMs,
    onFinish,
  }: StartShuffleAnimationOptions) => {
    if (isShufflingRef.current) {
      return false;
    }

    isShufflingRef.current = true;
    setIsShuffling(true);
    setAnimatedValues(baseValues.map((pair) => ({ ...pair })));

    let previewStep = 0;
    intervalRef.current = window.setInterval(() => {
      const step = previewStep++;
      setAnimatedValues((prev) => {
        const source = prev ?? baseValues;
        return source.map((pair, index) => {
          // Brief, staggered holds keep every row from moving in unison.
          if (baseLocks[index] || (step + index + 1) % 6 === 0) {
            return pair;
          }
          return { left: pair.right, right: pair.left };
        });
      });
    }, PREVIEW_INTERVAL_MS);

    timeoutRef.current = window.setTimeout(() => {
      finishShuffleAnimation(finalValues, onFinish);
    }, durationMs);

    return true;
  };

  return {
    isShuffling,
    animatedValues,
    startShuffleAnimation,
  };
}
