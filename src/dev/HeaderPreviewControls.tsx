import "./header-preview.css";

const VARIANTS = [
  ["original", "기존"],
  ["floating", "A 플로팅"],
  ["flat", "B 플랫"],
] as const;

export type HeaderPreviewVariant = (typeof VARIANTS)[number][0];

type HeaderPreviewControlsProps = {
  value: HeaderPreviewVariant;
  onChange: (value: HeaderPreviewVariant) => void;
};

export default function HeaderPreviewControls({ value, onChange }: HeaderPreviewControlsProps) {
  return (
    <aside className="header-preview-controls" aria-label="개발용 미리보기">
      <fieldset>
        <legend>헤더 시안 · 개발용</legend>
        <div className="header-preview-options">
          {VARIANTS.map(([variant, label]) => (
            <label key={variant} htmlFor={`header-preview-${variant}`}>
              <input
                id={`header-preview-${variant}`}
                type="radio"
                name="home-header-preview"
                value={variant}
                checked={value === variant}
                onChange={() => onChange(variant)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </aside>
  );
}
