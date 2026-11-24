export function WorkspaceBackground() {
  return (
    <div className="workspace-terrain" aria-hidden="true">
      <svg className="workspace-snowbanks" viewBox="0 0 1440 280" preserveAspectRatio="none" focusable="false">
        <path className="workspace-snow-far" d="M0 88C212 47 368 111 551 137S807 133 999 85 1275 37 1440 60V280H0Z" />
        <path className="workspace-snow-mid" d="M0 170C207 110 366 137 536 167S781 200 981 154 1272 116 1440 135V280H0Z" />
        <path className="workspace-snow-near" d="M0 217C202 201 327 198 516 219S799 229 1012 208 1268 172 1440 188V280H0Z" />
      </svg>
      <svg className="workspace-trail" viewBox="0 0 332 140" focusable="false">
        <defs>
          <path id="workspace-footprint" d="M0 9C-5 9-9 4-9-4Q-9-8-6-6L-3-3-2-9Q0-13 2-9L3-3 6-6Q9-8 9-4C9 4 5 9 0 9Z" />
        </defs>
        <g fill="currentColor">
          <use href="#workspace-footprint" transform="translate(19 122) rotate(56) scale(1.02)" />
          <use href="#workspace-footprint" transform="translate(63 96) rotate(57) scale(.96)" opacity=".94" />
          <use href="#workspace-footprint" transform="translate(107 100) rotate(61) scale(.9)" opacity=".87" />
          <use href="#workspace-footprint" transform="translate(151 70) rotate(55) scale(.84)" opacity=".8" />
          <use href="#workspace-footprint" transform="translate(194 73) rotate(51) scale(.78)" opacity=".72" />
          <use href="#workspace-footprint" transform="translate(231 46) rotate(49) scale(.72)" opacity=".64" />
          <use href="#workspace-footprint" transform="translate(270 47) rotate(47) scale(.66)" opacity=".56" />
          <use href="#workspace-footprint" transform="translate(303 23) rotate(45) scale(.6)" opacity=".48" />
        </g>
      </svg>
    </div>
  );
}
