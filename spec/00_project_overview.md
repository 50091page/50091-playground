# 50091 Project Overview

## Summary

`50091` is a game hub built with Vite, React, and TypeScript.

1. **Team shuffle** for League of Legends, PUBG, and Overwatch, plus an Overwatch map draw
2. **Aim trainer**, a reaction minigame rendered with PixiJS
3. **Reaction time test**, a five-attempt test of responses to a color cue
4. **Cosmic clock**, a text-only observation of elapsed time, cumulative motion and the distance light could have travelled

The Penguin Observatory is an unreleased prototype available only on development servers with the local source and images. Those files are excluded from the public repository and production site.

The ladder lottery is visible but disabled. The app has no backend, authentication, or server-side persistence. Team and map settings, explicit theme preferences, reaction personal bests and the cosmic departure timestamp use browser `localStorage`. Practice and test sessions live in memory.

## Tech Stack

- Runtime: React 18
- Build tool: Vite 5
- Language: TypeScript
- Routing: `react-router-dom` with `HashRouter`
- State management: Zustand for aim trainer state
- Rendering: DOM UI plus PixiJS via `@pixi/react`
- Styling: shared CSS with Tailwind base styles and utilities

## Entry And App Shell

### Bootstrap

- Entry file: `src/main.tsx`
- Global styles:
  - `src/styles/workspace.css`: theme, app shell, shared background, and home menu
  - `src/styles/tool-workspaces.css`: shuffle and aim workspaces

### Root App Responsibilities

File: `src/App.tsx`

- Wraps the app with `HashRouter`
- Lazily loads tool pages on navigation. In both development and production, the loading message appears only while a route module loads, with no artificial wait.
- Tracks route changes with Google Analytics except on the reaction test route, when `window.gtag` is present.
- Manages theme toggle UI through `useTheme`

### Routes

| Path | Behavior |
| --- | --- |
| `#/` | Home menu |
| `#/shuffle` | Team shuffle, with three in-page game tabs and no game-specific URL |
| `#/aim-trainer` | Aim trainer |
| `#/reaction-test` | Reaction time test |
| `#/cosmic-clock` | [Cosmic clock](05_cosmic_clock_spec.md); part of the home page's `힐링` category |
| `#/observatory` | The `힐링` card and route are enabled only in development when the local prototype exists. Otherwise the URL redirects home. |
| `#/ladder` | Disabled; direct visits redirect home |
| Any other path | Redirects home |

### Shared Header

- The home and tool pages share the `기존` (original) full-width flat header, with a translucent surface and a subtle `1px` bottom rule.
- The inner row follows the same `1120px` max-width as the content. `50091` links home on the left; the character button on the right toggles light and dark themes.
- The desktop header is `64px`, including its rule. Global navigation is hidden on the home page. All tool pages share the Team Shuffle, Aim Trainer, Reaction Time Test, and disabled Ladder Lottery entries and highlight the current route. On narrow screens, navigation moves below the brand and theme button; at the smallest widths it uses two columns.
- Only the development home page offers `기존`, `A 플로팅` (floating), and `B 플랫` (flat). It defaults to the original, never applies A/B to tool pages, and excludes the selector and preview styles from production.
- Preview source: `src/dev/HeaderPreviewControls.tsx` and `src/dev/header-preview.css`.

### Shared Background

- The original homepage background is the sitewide standard. `workspace.css` defines the theme surfaces and gradients, including the upper-left blue-violet glow in dark mode. `WorkspaceBackground` renders the waves and penguin footprints once, outside the routed content.
- The decoration sits behind the content, ends immediately above the footer, and does not receive pointer events.
- Existing and future routes inherit this background automatically. Do not add page-level replacements or duplicate decorations. Cards, canvases, and the reaction test's red and green stimuli retain their own surfaces.

### Shared Footer

- Every page ends with `Made by 저둥저둥`. The existing typography, colors, spacing, left alignment, and top divider are unchanged.

## Pages

### Menu

File: `src/pages/MenuPage.tsx`

- The wide layout has a Team Shuffle card with no section heading on the left, and Aim Trainer, Reaction Time Test, and Ladder Lottery under `연습·미니게임` on the right. On narrow screens, Team Shuffle appears above the minigames.
- Cards have a base height of `136px` and a `22px` corner radius. Team Shuffle alone shows a penguin and the subtitle `팀 편성 · 맵 추첨`, which is `13px` by default and sits `5px` below the title. The other cards show only a title and an icon.
- The `힐링` section follows the existing feature area and aligns with `연습·미니게임` on wide screens. These cards do not enter the shared header navigation. Cosmic Clock shows an orbit icon; the dev-only Observatory card shows the existing mascot.
- Enabled cards are links that activate with `Enter`. While `LADDER_DISABLED` is true, the ladder card and global menu entry are dimmed, expose `aria-disabled="true"`, and have no destination. The shared list places enabled items before disabled ones and preserves order within each group.

### Shuffle

File: `src/pages/ShufflePage.tsx`

- League of Legends (default), PUBG, and Overwatch can be selected from the in-page tab row. Only the active panel is visible.
- LoL and PUBG each show a centered card. Overwatch shows team shuffle and map draw side by side on wide screens and stacked on narrow screens.
- Inactive panels are hidden rather than unmounted, so input, locks, map settings, and in-flight work survive switching.
- See the [team shuffle specification](01_shuffle_tool_spec.md).

### Aim Trainer

File: `src/pages/AimTrainerPage.tsx`

- Renders the Pixi canvas playfield
- Hosts game HUD, start/pause/finish overlays, option panel, and audio playback
- Uses Zustand store as the single state source for game session state
- The `50091` header link returns home. See the [aim trainer specification](02_aim_trainer_spec.md).

### Reaction Time Test

Measures five responses to a color cue in the browser and stores the best session average by input type. See the [reaction time specification](03_reaction_time_spec.md) for the rules and timing limits.

## Shared Application Behavior

### Theme

Files:

- `src/hooks/useTheme.ts`
- `src/utils/storage.ts`

Behavior:

- Theme values: `light` or `dark`
- Storage key: `soopi-utils.theme`
- First load behavior:
  - use stored theme if present
  - otherwise follow `prefers-color-scheme`
- Once the user toggles theme, preference becomes sticky in `localStorage`
- Theme is reflected by:
  - `document.documentElement.dataset.theme`
  - `dark` class on the root element

### Storage Safety

`safeLocalStorageGet` and `safeLocalStorageSet` wrap storage calls in `try/catch` so the app does not crash when browser storage is unavailable.

## Public Assets

### Images

Used for:

- menu cards
- theme toggle button
- tool icons
- social preview / favicon

### Audio

Used by the aim trainer:

- `hit.wav`
- `miss.wav`

## Test Coverage

Current automated tests are plain TypeScript test runners executed through `npm test`.

Covered areas:

- shuffle swap fairness and invariants
- swap tool helper functions
- duplicate-name normalization logic
- Overwatch map candidate filtering and state migration
- reaction test timestamp compatibility, false starts, duplicate input, interruptions, statistics, and cleanup
- Cosmic Clock time calculations, planetary milestones, refresh cadence, and reset persistence

Not covered by automated tests:

- React UI rendering behavior
- route navigation
- theme toggle interaction
- aim trainer Pixi interaction and timing loop

Game tab layout, keyboard navigation, and retention of names, locks, and map results were checked manually in the browser.

## Build And Run

### Scripts

- `npm run dev` -> Vite development server
- `npm run build` -> TypeScript build + Vite production build
- `npm run preview` -> preview built app
- `npm test` -> compile and run custom TypeScript tests

### Deployment Shape

- Static frontend only
- `.github/workflows/deploy.yml` builds and deploys `dist` to GitHub Pages on pushes to `main` or manual runs.
- Even when the local Observatory files are present, Vite builds exclude the development entry before processing its assets.
- `public/CNAME` configures `50091.xyz` as the custom domain.
- `HashRouter` keeps routing compatible with static hosting
