import { useMemo, type CSSProperties } from "react";
import { buildNormalizedNameCounts, hasDuplicateNames, isDuplicateName } from "../utils/nameDuplicates";
import type { RowPair } from "../types/swap";

type ActionTone = "default" | "accent" | "danger";

type GridAction = {
  label: string;
  tone?: ActionTone;
  onClick: () => void;
};

type NameInputProps = {
  sideClassName: string;
  value: string;
  rowLabel: string;
  placeholder: string;
  isBusy: boolean;
  isDuplicate: boolean;
  onChange: (value: string) => void;
};

function NameInput({
  sideClassName,
  value,
  rowLabel,
  placeholder,
  isBusy,
  isDuplicate,
  onChange,
}: NameInputProps) {
  const stateClass = isDuplicate ? " is-duplicate" : value.trim() ? " is-filled" : " is-empty";

  return (
    <input
      className={`name-input${sideClassName}${stateClass}`}
      value={value}
      placeholder={placeholder}
      aria-label={`${rowLabel} ${placeholder || "팀"} 이름`}
      disabled={isBusy}
      aria-invalid={isDuplicate ? true : undefined}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

type RowSwapGridProps = {
  title: string;
  variant?: "lol" | "pubg";
  lockGuide: string;
  shuffleCount: number;
  isBusy?: boolean;
  rows: string[];
  values: RowPair[];
  locks: boolean[];
  useTeamTint?: boolean;
  leftPlaceholder?: string;
  rightPlaceholder?: string;
  busyDurationMs?: number;
  secondaryActions?: GridAction[];
  onValueChange: (index: number, side: "left" | "right", value: string) => void;
  onLockChange: (index: number, value: boolean) => void;
  onShuffle: () => void;
  onResetCount: () => void;
  onClearMembers: () => void;
};

export function RowSwapGrid({
  title,
  variant = "lol",
  lockGuide,
  shuffleCount,
  isBusy = false,
  rows,
  values,
  locks,
  useTeamTint = false,
  leftPlaceholder = "",
  rightPlaceholder = "",
  busyDurationMs = 820,
  secondaryActions,
  onValueChange,
  onLockChange,
  onShuffle,
  onResetCount,
  onClearMembers,
}: RowSwapGridProps) {
  const shuffleLabel = isBusy ? "섞는 중..." : shuffleCount > 0 ? `돌리기 (${shuffleCount})` : "돌리기";

  const normalizedCounts = useMemo(() => buildNormalizedNameCounts(values), [values]);

  const hasDuplicates = useMemo(() => hasDuplicateNames(normalizedCounts), [normalizedCounts]);

  const indexedRows = useMemo(
    () => rows.map((row, index) => ({ label: row, index })),
    [rows]
  );
  const utilityActions = useMemo<GridAction[]>(
    () => [
      { label: "초기화", tone: "default", onClick: onResetCount },
      ...(secondaryActions ?? []),
      { label: "지우기", tone: "danger", onClick: onClearMembers },
    ],
    [onClearMembers, onResetCount, secondaryActions]
  );

  return (
    <section
      className={`tool-card tool-card-${variant}${isBusy ? " is-busy" : ""}`}
      style={{ "--busy-duration": `${busyDurationMs}ms` } as CSSProperties}
    >
      <div className="tool-card-head">
        <h2>{title}</h2>
      </div>
      <p className="lock-guide">{lockGuide}</p>
      {hasDuplicates ? <p className="duplicate-guide">중복된 이름이 있습니다.</p> : null}
      <div className="row-list">
        {indexedRows.map(({ label, index }) => (
          <div className={`row-item${locks[index] ? " is-locked" : ""}`} key={label}>
            <div className="row-label">
              <button
                type="button"
                className={`row-lock-toggle${locks[index] ? " is-locked" : ""}`}
                onClick={() => onLockChange(index, !locks[index])}
                aria-pressed={locks[index]}
                tabIndex={-1}
                disabled={isBusy}
              >
                <span>{label}</span>
                {locks[index] ? <span className="lock-pill">고정</span> : null}
              </button>
            </div>

            <NameInput
              sideClassName={useTeamTint ? " team-blue" : ""}
              value={values[index]?.left ?? ""}
              rowLabel={label}
              placeholder={leftPlaceholder || "왼쪽팀"}
              isBusy={isBusy}
              isDuplicate={isDuplicateName(normalizedCounts, values[index]?.left ?? "")}
              onChange={(value) => onValueChange(index, "left", value)}
            />
            <NameInput
              sideClassName={useTeamTint ? " team-red" : ""}
              value={values[index]?.right ?? ""}
              rowLabel={label}
              placeholder={rightPlaceholder || "오른쪽팀"}
              isBusy={isBusy}
              isDuplicate={isDuplicateName(normalizedCounts, values[index]?.right ?? "")}
              onChange={(value) => onValueChange(index, "right", value)}
            />
          </div>
        ))}
      </div>

      <div className="button-row">
        <div className="btn-group btn-group-primary">
          <button type="button" className="btn primary" onClick={onShuffle} disabled={isBusy}>
            {shuffleLabel}
          </button>
        </div>
        <div className="btn-group btn-group-secondary">
          {utilityActions.map((action) => (
            <button
              type="button"
              className={`btn${
                action.tone === "accent" ? " accent" : action.tone === "danger" ? " danger" : ""
              }`}
              onClick={action.onClick}
              disabled={isBusy}
              key={action.label}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
