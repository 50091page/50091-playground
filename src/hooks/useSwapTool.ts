import { SHUFFLE_ANIMATION_MS } from "../constants/shuffle.js";
import { useLocalStorage } from "./useLocalStorage.js";
import { useShuffleAnimation } from "./useShuffleAnimation.js";
import { useToastNotice } from "./useToastNotice.js";
import { shuffleSwapRows } from "../utils/shuffleSwap.js";
import type { RowPair } from "../types/swap.js";

type SwapToolState = {
  values: RowPair[];
  locks: boolean[];
  shuffleCount: number;
};

type UseSwapToolOptions = {
  storageKey: string;
  legacyKeys?: string[];
  rows: string[];
  allowEmptySwap?: boolean;
  leftFallback: string;
  rightFallback: string;
  copyHeader?: {
    left: string;
    right: string;
  };
  copyRowLabels?: string[];
};

export const createDefaultSwapToolState = (rows: string[]): SwapToolState => ({
  values: rows.map(() => ({ left: "", right: "" })),
  locks: rows.map(() => false),
  shuffleCount: 0,
});

export function migrateSwapToolState(value: unknown, rows: string[]): SwapToolState {
  const defaults = createDefaultSwapToolState(rows);
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const raw = value as Partial<SwapToolState>;
  return {
    values:
      Array.isArray(raw.values) && raw.values.length === rows.length
        ? raw.values.map((row) => ({
            left: typeof row?.left === "string" ? row.left : "",
            right: typeof row?.right === "string" ? row.right : "",
          }))
        : defaults.values,
    locks:
      Array.isArray(raw.locks) && raw.locks.length === rows.length
        ? raw.locks.map((lock) => Boolean(lock))
        : defaults.locks,
    // Keep shuffle count session-scoped: always reset on page reload.
    shuffleCount: 0,
  };
}

export function formatRowsForCopy(
  values: RowPair[],
  leftFallback: string,
  rightFallback: string,
  copyHeader?: {
    left: string;
    right: string;
  },
  copyRowLabels?: string[]
) {
  const rowLabels = copyRowLabels?.length === values.length ? copyRowLabels : undefined;
  const leftNames = values.map((pair) => pair.left.trim() || leftFallback);
  const rightNames = values.map((pair) => pair.right.trim() || rightFallback);
  const leftWidth = Math.max(...leftNames.map((name) => name.length));
  const rowWidth = rowLabels ? Math.max(...rowLabels.map((label) => label.length)) : 0;
  const lines = leftNames.map((leftName, index) => {
    const baseLine = `${leftName.padEnd(leftWidth, " ")}\t${rightNames[index]}`;
    return rowLabels ? `[${rowLabels[index].padEnd(rowWidth, " ")}] ${baseLine}` : baseLine;
  });

  if (!copyHeader) {
    return lines;
  }

  const headerWidth = Math.max(leftWidth, copyHeader.left.length);
  const headerLine = `${copyHeader.left.padEnd(headerWidth, " ")}\t${copyHeader.right}`;
  return rowLabels ? [`[${"".padEnd(rowWidth, " ")}] ${headerLine}`, ...lines] : [headerLine, ...lines];
}

export function useSwapTool({
  storageKey,
  legacyKeys,
  rows,
  allowEmptySwap = false,
  leftFallback,
  rightFallback,
  copyHeader,
  copyRowLabels,
}: UseSwapToolOptions) {
  const [state, setState] = useLocalStorage<SwapToolState>(storageKey, createDefaultSwapToolState(rows), {
    legacyKeys,
    migrate: (value) => migrateSwapToolState(value, rows),
  });
  const { toastMessage, showNotice } = useToastNotice();
  const { isShuffling, animatedValues, startShuffleAnimation } = useShuffleAnimation();

  const onValueChange = (index: number, side: "left" | "right", value: string) => {
    setState((prev) => {
      const nextValues = [...prev.values];
      const row = nextValues[index] ?? { left: "", right: "" };
      nextValues[index] = { ...row, [side]: value };
      return { ...prev, values: nextValues };
    });
  };

  const onLockChange = (index: number, value: boolean) => {
    setState((prev) => {
      const nextLocks = [...prev.locks];
      nextLocks[index] = value;
      return { ...prev, locks: nextLocks };
    });
  };

  const onShuffle = () => {
    if (isShuffling) {
      return;
    }

    const baseValues = state.values;
    const baseLocks = state.locks;
    const finalValues = shuffleSwapRows(
      baseValues.map((pair, index) => ({ ...pair, locked: baseLocks[index] })),
      allowEmptySwap
    ).map(({ left, right }) => ({ left, right }));

    startShuffleAnimation({
      baseValues,
      baseLocks,
      finalValues,
      durationMs: SHUFFLE_ANIMATION_MS,
      onFinish: (nextValues) => {
        setState((prev) => ({
          ...prev,
          shuffleCount: (prev.shuffleCount ?? 0) + 1,
          values: nextValues,
        }));
      },
    });
  };

  const onResetCount = () => {
    setState((prev) => ({
      ...prev,
      shuffleCount: 0,
    }));
  };

  const onClearMembers = () => {
    setState((prev) => ({
      ...prev,
      values: prev.values.map(() => ({ left: "", right: "" })),
    }));
  };

  const onCopyRows = async () => {
    const copySource = animatedValues ?? state.values;
    const lines = formatRowsForCopy(copySource, leftFallback, rightFallback, copyHeader, copyRowLabels);
    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      showNotice("복사가 되었습니다.");
      return;
    } catch {
      showNotice("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  return {
    values: animatedValues ?? state.values,
    locks: state.locks,
    shuffleCount: state.shuffleCount ?? 0,
    isShuffling,
    toastMessage,
    onValueChange,
    onLockChange,
    onShuffle,
    onResetCount,
    onClearMembers,
    onCopyRows,
  };
}
