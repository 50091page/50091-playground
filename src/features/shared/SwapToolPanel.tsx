import { RowSwapGrid } from "../../components/RowSwapGrid";
import { useSwapTool } from "../../hooks/useSwapTool";

type SwapToolPanelProps = {
  title: string;
  variant: "lol" | "pubg" | "overwatch";
  rows: string[];
  storageKey: string;
  legacyKeys: string[];
  leftFallback: string;
  rightFallback: string;
  copyHeader?: {
    left: string;
    right: string;
  };
  copyRowLabels?: string[];
  allowEmptySwap?: boolean;
  leftPlaceholder?: string;
  rightPlaceholder?: string;
};

export function SwapToolPanel({
  title,
  variant,
  rows,
  storageKey,
  legacyKeys,
  leftFallback,
  rightFallback,
  copyHeader,
  copyRowLabels,
  allowEmptySwap = false,
  leftPlaceholder,
  rightPlaceholder,
}: SwapToolPanelProps) {
  const {
    values,
    locks,
    shuffleCount,
    isShuffling,
    toastMessage,
    onValueChange,
    onLockChange,
    onShuffle,
    onResetCount,
    onClearMembers,
    onCopyRows,
  } = useSwapTool({
    storageKey,
    legacyKeys,
    rows,
    allowEmptySwap,
    leftFallback,
    rightFallback,
    copyHeader,
    copyRowLabels,
  });

  return (
    <>
      <RowSwapGrid
        title={title}
        variant={variant}
        shuffleCount={shuffleCount}
        isBusy={isShuffling}
        rows={rows}
        values={values}
        locks={locks}
        leftPlaceholder={leftPlaceholder}
        rightPlaceholder={rightPlaceholder}
        onValueChange={onValueChange}
        onLockChange={onLockChange}
        onShuffle={onShuffle}
        onResetCount={onResetCount}
        onClearMembers={onClearMembers}
        secondaryActions={[{ label: "복사하기", icon: "copy", tone: "accent", onClick: onCopyRows }]}
      />
      {toastMessage ? (
        <div className="toast-notice" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </>
  );
}
