import { SwapToolPanel } from "../shared/SwapToolPanel";

const OVERWATCH_ROWS = ["탱커1", "탱커2", "딜러1", "딜러2", "힐러1", "힐러2"];

type OverwatchToolProps = {
  allowEmptySwap?: boolean;
};

export function OverwatchTool({ allowEmptySwap = false }: OverwatchToolProps) {
  return (
    <SwapToolPanel
      title="오버워치 팀 섞기"
      variant="overwatch"
      rows={OVERWATCH_ROWS}
      storageKey="shuffle.overwatch.state.v1"
      legacyKeys={[]}
      allowEmptySwap={allowEmptySwap}
      leftFallback="팀 1"
      rightFallback="팀 2"
      copyRowLabels={OVERWATCH_ROWS}
      leftPlaceholder="플레이어 이름"
      rightPlaceholder="플레이어 이름"
    />
  );
}
