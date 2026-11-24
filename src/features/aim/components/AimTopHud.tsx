type AimTopHudProps = {
  scoreText: string;
  remainingText: string;
  targetDuration: number;
};

export function AimTopHud({ scoreText, remainingText, targetDuration }: AimTopHudProps) {
  return (
    <dl className="aim-scoreboard">
      <div><dt>점수</dt><dd>{scoreText}</dd></div>
      <div><dt>남은 과녁</dt><dd>{remainingText}</dd></div>
      <div><dt>유지 시간</dt><dd>{targetDuration}<small> ms</small></dd></div>
    </dl>
  );
}
