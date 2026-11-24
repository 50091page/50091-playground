import type { CSSProperties, ReactNode } from "react";
import type { ReferenceId } from "./astronomy";

const viewSize = 24;
const center = viewSize / 2;

// The connecting line meets the artwork at these x-coordinates on the center axis.
const symbols = {
  earth: { edges: [2.25, 21.75], artwork: <>
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    <path d="M3 12h18" />
  </> },
  station: { edges: [1.75, 22.25], artwork: <>
    <path d="M2.5 5.75h5v12.5h-5zM16.5 5.75h5v12.5h-5zM2.5 12h19M12 7.75v8.5" />
  </> },
  orbit: { edges: [2.05, 21.95], artwork: <>
    <circle cx="12" cy="12" r="4.6" />
    <path d="M20.64 8.85A9.2 9.2 0 1 1 16.6 4.03" />
    <circle cx="19.1" cy="5.95" r="1.55" fill="currentColor" stroke="none" />
  </> },
  moon: { edges: [2.25, 21.75], artwork:
    <path d="M21 12C14.3 14.4 8.7 9.7 11 3.06A9 9 0 1 0 21 12Z" />,
  },
  sun: { edges: [1.75, 22.25], artwork: <>
    <circle cx="12" cy="12" r="4.85" />
    <path d="M12 2.5v2.1m0 14.8v2.1M2.5 12h2.1m14.8 0h2.1M5.3 5.3l1.5 1.5m10.4 10.4 1.5 1.5m0-13.4-1.5 1.5M6.8 17.2l-1.5 1.5" />
  </> },
  planet: { edges: [2.25, 21.75], artwork: <>
    <circle cx="12" cy="12" r="9" />
    <path d="M6.55 10.25a5.7 5.7 0 0 1 3.6-3.7" strokeOpacity=".75" />
  </> },
  ringed: { edges: [1.85, 21.55], artwork: <>
    <circle cx="12" cy="12" r="6.8" />
    <path d="M5.95 9.65c-3 1.4-4.2 2.9-3.35 4.2 1.5 2.65 12.6 1.9 17.8-1.85 2.7-1.95 1.8-3.9-2.2-4.05" />
  </> },
  asteroids: { edges: [1.75, 22.25], artwork: <>
    <path d="M2.7 12h.01M5.8 8.4h.01M10.75 6.15h.01M16 6.5h.01M20.25 8.7h.01M21.3 12h.01M18.3 15.6h.01M13.25 17.85h.01M8 17.5h.01M3.75 15.3h.01" strokeWidth="1.9" />
    <path d="m10.5 11.65 1.45-1.35 1.65 1.55-1.55 1.7Z" />
  </> },
  kuiper: { edges: [1.75, 22.25], artwork: <>
    <path d="M2.5 12h.01M4.2 8.8h.01M7.2 6.8h.01M12 6h.01M16.8 6.8h.01M19.8 8.8h.01M21.5 12h.01M19.8 15.2h.01M16.8 17.2h.01M12 18h.01M7.2 17.2h.01M4.2 15.2h.01" />
    <circle cx="12" cy="12" r="1.9" />
  </> },
  heliopause: { edges: [1.75, 22.25], artwork: <>
    <path d="M19.55 6.23A9.5 9.5 0 1 0 21.5 12M16.82 8.25A6.1 6.1 0 1 0 18.1 12" />
    <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
  </> },
  oort: { edges: [1.85, 22.15], artwork: <>
    <path d="M2.75 12h.01M4.3 7h.01M7.9 3.8h.01M13.2 2.9h.01M18.25 5.1h.01M21.25 12h.01M19.7 17h.01M16.1 20.2h.01M10.8 21.1h.01M5.75 18.9h.01" strokeWidth="1.8" />
    <path d="M8.2 10.25h.01M13.65 7.6h.01M16.35 13.25h.01M10 16.05h.01" strokeWidth="1.9" />
  </> },
  star: { edges: [1.75, 22.25], artwork:
    <path d="M12 2.5c.95 5.95 3.05 8.05 9.5 9.5-6.45 1.45-8.55 3.55-9.5 9.5-.95-5.95-3.05-8.05-9.5-9.5 6.45-1.45 8.55-3.55 9.5-9.5Z" />,
  },
  nebula: { edges: [1.8, 22.2], artwork: <>
    <path d="M2.55 12c0-2.4 2.2-4.25 5-4.05.35-2.6 3.2-3.65 5.3-1.9 2.25-1.7 5.55-.3 5.65 2.65 1.9.15 2.95 1.55 2.95 3.3 0 2.85-2.45 4.1-4.8 3.55-1.55 3.1-5.65 3.6-7.95 1.3-3.2 1.05-6.15-1.15-6.15-4.85Z" />
    <path d="M8.05 13.15c1.45-1.6 3.5-1.75 4.8-.4m2.15-2.1h.01" strokeOpacity=".72" />
  </> },
  galaxy: { edges: [1.8, 22.2], artwork: <>
    <path d="M2.55 12C3.6 7.2 8.35 4.35 13.55 5.2c3.9.65 5.9 3.2 4.4 5.7-1.2 2-4.35 3-6.7 1.85" />
    <path d="M21.45 12c-1.05 4.8-5.8 7.65-11 6.8-3.9-.65-5.9-3.2-4.4-5.7 1.2-2 4.35-3 6.7-1.85" />
  </> },
} satisfies Record<string, { edges: [number, number]; artwork: ReactNode }>;

const symbolKind = {
  launch: "earth", iss: "station", geo: "orbit", moon: "moon", sun: "sun",
  mercury: "planet", venus: "planet", mars: "planet", jupiter: "planet", saturn: "ringed", uranus: "planet", neptune: "planet",
  asteroidsIn: "asteroids", asteroidsOut: "asteroids", kuiperIn: "kuiper", kuiperOut: "kuiper", heliopause: "heliopause",
  oortIn: "oort", oortInterior: "oort", oortOut: "oort",
  proxima: "star", alpha: "star", barnard: "star", sirius: "star", vega: "star", polaris: "star", orion: "nebula",
  center: "galaxy", lmc: "galaxy", smc: "galaxy", andromeda: "galaxy", triangulum: "galaxy",
} satisfies Record<ReferenceId, keyof typeof symbols>;

export function milestoneLineStyle(start: ReferenceId, end: ReferenceId): CSSProperties {
  return {
    "--cosmic-line-start": (symbols[symbolKind[start]].edges[1] - center) / viewSize,
    "--cosmic-line-end": (center - symbols[symbolKind[end]].edges[0]) / viewSize,
  } as CSSProperties;
}

export function MilestoneSymbol({ id }: { id: ReferenceId }) {
  return (
    <svg className="cosmic-journey-symbol" viewBox={`0 0 ${viewSize} ${viewSize}`}
      width={viewSize} height={viewSize} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {symbols[symbolKind[id]].artwork}
    </svg>
  );
}
