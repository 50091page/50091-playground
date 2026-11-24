import type { TargetLifetimeMs, TargetSizeMultiplier, TargetStyleKey } from "../store/useAimStore";

type TargetStyleOption = { key: TargetStyleKey; label: string; swatch: string };
type TargetSizeOption = { value: TargetSizeMultiplier; label: string; previewPx: number };

type AimOptionsPanelProps = {
  targetStyle: TargetStyleKey;
  targetDuration: TargetLifetimeMs;
  targetSizeMultiplier: TargetSizeMultiplier;
  targetStyleOptions: TargetStyleOption[];
  targetSizeOptions: TargetSizeOption[];
  minDuration: number;
  maxDuration: number;
  stepDuration: number;
  onSelectStyle: (style: TargetStyleKey) => void;
  onSelectSize: (size: TargetSizeMultiplier) => void;
  onSelectDuration: (duration: TargetLifetimeMs) => void;
};

export function AimOptionsPanel({
  targetStyle,
  targetDuration,
  targetSizeMultiplier,
  targetStyleOptions,
  targetSizeOptions,
  minDuration,
  maxDuration,
  stepDuration,
  onSelectStyle,
  onSelectSize,
  onSelectDuration,
}: AimOptionsPanelProps) {
  return (
    <div className="aim-style-picker">
      <fieldset>
        <legend>과녁 색상</legend>
        <div className="aim-option-row">
          {targetStyleOptions.map((option) => (
            <button
              type="button"
              key={option.key}
              className={`aim-style-option${targetStyle === option.key ? " is-selected" : ""}`}
              onClick={() => onSelectStyle(option.key)}
              aria-pressed={targetStyle === option.key}
            >
              <span className="aim-style-option-swatch" style={{ background: option.swatch }} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>과녁 크기</legend>
        <div className="aim-option-row">
          {targetSizeOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`aim-size-option${targetSizeMultiplier === option.value ? " is-selected" : ""}`}
              onClick={() => onSelectSize(option.value)}
              aria-pressed={targetSizeMultiplier === option.value}
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
      </fieldset>

      <fieldset>
        <legend>과녁 유지 시간</legend>
        <div className="aim-fade-slider-wrap">
          <input
            type="range"
            min={minDuration}
            max={maxDuration}
            step={stepDuration}
            value={targetDuration}
            className="aim-fade-slider"
            onChange={(event) => onSelectDuration(Number(event.currentTarget.value) as TargetLifetimeMs)}
            aria-label="과녁 유지 시간"
          />
          <span className="aim-fade-slider-value">{targetDuration}ms</span>
        </div>
      </fieldset>
    </div>
  );
}
