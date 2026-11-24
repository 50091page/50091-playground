# Team Shuffle Specification

## Scope

The `#/shuffle` workspace provides three variants built on the same reusable implementation, plus an Overwatch map draw:

- `League of Legends` team shuffle
- `PUBG` team shuffle
- `Overwatch` team shuffle and map draw

Core implementation files:

- `src/pages/ShufflePage.tsx`
- `src/features/shared/SwapToolPanel.tsx`
- `src/components/RowSwapGrid.tsx`
- `src/hooks/useSwapTool.ts`
- `src/hooks/useShuffleAnimation.ts`
- `src/utils/shuffleSwap.ts`
- `src/utils/nameDuplicates.ts`
- `src/features/overwatch/OverwatchSection.tsx`, `OverwatchMapTool.tsx`, and `overwatchMaps.ts`
- `src/styles/tool-workspaces.css`

## Game Tabs And Layout

- The in-page tab row aligns with the left edge of the workspace, below the shared header. The selected tab has brighter text and a thin underline. Switching does not change the URL or move the tab row.
- League of Legends is selected on entry. LoL and PUBG each show one centered card, up to `34rem` wide.
- Overwatch shows team shuffle and map draw in equal, top-aligned columns above `840px`. At or below `840px`, they stack with team shuffle first.
- Arrow keys select adjacent tabs; `Home` and `End` select the first and last. Inactive panels use `hidden` but stay mounted, preserving names, locks, shuffle counts, map choices, results, and in-flight animations.
- The `50091` link in the global header returns home.

## Variants

### LoL

File: `src/features/lol/LolTool.tsx`

- Rows:
  - 탑
  - 정글
  - 미드
  - 원딜
  - 서폿
- Storage key: `shuffle.lol.state.v2`
- Legacy keys:
  - `shuffle.lol.state`
  - `soopi-utils.lol.state`
- Fallback team labels for copy:
  - left: `블루팀`
  - right: `레드팀`
- Inputs use blue/red accents and the same labels as placeholders. Copied text starts with a `블루` / `레드` header.

### PUBG

File: `src/features/pubg/PubgTool.tsx`

- Rows:
  - 1티어
  - 2티어
  - 3티어
  - 4티어
- Storage key: `shuffle.pubg.state.v2`
- Legacy keys:
  - `shuffle.pubg.state`
  - `soopi-utils.pubg.state`
- Fallback team labels for copy:
  - left: `팀 1`
  - right: `팀 2`
- Neutral inputs use `플레이어 이름` on both sides. Copied rows have no extra header or role label.

### Overwatch

File: `src/features/overwatch/OverwatchTool.tsx`

- Six rows: `탱커1`, `탱커2`, `딜러1`, `딜러2`, `힐러1`, `힐러2`.
- Storage key: `shuffle.overwatch.state.v1`. No legacy key.
- Neutral inputs use `플레이어 이름` on both sides; blank copied values become `팀 1` and `팀 2`.
- Copied rows start with a bracketed role, e.g. `[탱커1]`.

## Data Model

### Per Row

Type: `RowPair` or `SwapRow`

- `left: string`
- `right: string`
- `locked: boolean` when entering the pure shuffle utility

### Stored State

`SwapToolState`

- `values: RowPair[]`
- `locks: boolean[]`
- `shuffleCount: number`

## Persistence And Migration

Handled by `useLocalStorage` and `migrateSwapToolState`.

Rules:

- state is loaded from the current storage key if possible
- if not found, legacy keys are checked in order
- invalid or partial stored data is normalized back to safe defaults
- `shuffleCount` survives in-page game switches but resets to `0` on reload or when reentering the workspace

Save behavior:

- updates are debounced by `200ms`
- the latest state is also flushed on unmount

## User Interface

### Main Grid

Rendered by `RowSwapGrid`.

Each row contains:

- row label
- lock toggle
- left player input
- thin separator, with no manual swap button
- right player input

### Header Controls

- game icon by variant
- panel title
- `지우기` clears names without clearing locks or the shuffle count

### Footer Controls

- shuffle button
- `초기화` resets the shuffle count without clearing names or locks
- copy button

### Input UX

- duplicate names are highlighted
- duplicate warning icon appears on affected inputs
- a Korean warning appears under the inputs when a duplicate exists; it does not block use
- pressing `Backspace` in an empty input moves focus to the previous input
- locked rows are visually marked and excluded from shuffling

## Shuffle Behavior

Pure logic lives in `shuffleSwapRows`.

Rules:

1. Each row is evaluated independently.
2. Locked rows never change.
3. If `allowEmptySwap` is `false`, rows with an empty left or right value do not swap.
4. Otherwise, each row swaps left/right with `50%` probability.

Random source behavior:

- prefers `crypto.getRandomValues`
- falls back to `Math.random()` if Web Crypto is unavailable

## Shuffle Animation

Handled by `useShuffleAnimation`.

Behavior:

- animation duration: `820ms`
- unlocked rows preview a swap or a brief staggered hold every `40ms`; CSS adds rattle and streak effects, with a silver palette for Overwatch
- locked rows remain fixed during animation
- clicking Shuffle plays the team shuffle animation regardless of the system's reduced-motion preference. This rule does not apply to the Overwatch map draw.
- the final result is computed at the start and committed when the animation finishes; controls are disabled while it runs

## Copy Behavior

Handled by `formatRowsForCopy` and `onCopyRows`.

Output format:

- one line per row
- left and right values separated by a tab character
- left column is padded to the longest left-side value
- blank cells are replaced with configured fallback labels
- LoL prepends its team header; Overwatch prefixes each row with `[role]`.

Clipboard result messages:

- success: `복사가 되었습니다.`
- failure: `복사에 실패했습니다. 브라우저 권한을 확인해 주세요.`

## Duplicate Detection

Handled by `buildNormalizedNameCounts`, `hasDuplicateNames`, and `isDuplicateName`.

Rules:

- comparison is case-insensitive
- leading and trailing whitespace is ignored
- both left and right columns participate in the same duplicate set
- empty strings are ignored

## Overwatch Map Draw

`OverwatchMapTool.tsx` renders `모드 선택` (mode selection), `맵 선택` (map selection), and `랜덤 결과` (draw result). Mode and map chips toggle independently; selected chips show a checkmark and fill. Hovering on an unselected chip does not promote it to selected styling. There are no bulk select or clear buttons.

Map groups follow the same order as the mode buttons: Control, Escort, Hybrid, Push, Flashpoint, and Assault. Toggling modes or drawing a map does not reorder the groups. Chip and group borders are subdued, while mode labels retain their individual tints and selected-map counts.

Mode button borders remain slightly stronger than map button borders. Group labels show the mode name on one line and use smaller, muted text for the count. Stacked labels have a 3–4 px gap; narrow cards retain the side-by-side label layout.

- Only enabled modes' maps are listed. The candidate pool is the intersection of maps in enabled modes and individually selected maps. Disabling a mode does not remove individual map choices in that mode.
- All modes may be turned off. An empty pool produces a notice and does not replace the result.
- `맵 뽑기` picks one candidate at random. With reduced motion off, names cycle every `35ms`; the result and count update after `1040ms`. Reduced motion skips the cycling.
- Reset enables all modes and maps, clears the last result, and resets the draw count to zero.
- `shuffle.overwatch.map.state.v1` saves `selectedModes`, `selectedMaps`, `lastDrawnMap`, and `drawCount`. Zero selected modes survive a game tab switch but the current migration restores all modes on reload or reentry. An empty selected map list is preserved on load.

| Mode | Maps (33 total) |
| --- | --- |
| 쟁탈 (Control) | 네팔, 리장 타워, 부산, 사모아, 오아시스, 일리오스 |
| 호위 (Escort) | 66번 국도, 지브롤터, 도라도, 리알토, 샴발리 수도원, 서킷 로얄, 쓰레기촌, 하바나 |
| 혼합 (Hybrid) | 눔바니, 미드타운, 블리자드 월드, 아이헨발데, 왕의 길, 파라이수, 할리우드 |
| 밀기 (Push) | 뉴 퀸 스트리트, 이스페란사, 콜로세오, 루나사피 |
| 플래시포인트 (Flashpoint) | 뉴 정크 시티, 수라바사, 아틀리스 |
| 점령 (Assault) | 볼스카야, 아누비스 신전, 파리, 하나무라, 호라이즌 달 기지 |

## Test Expectations

Current tests verify:

- locked rows are preserved
- empty-row swap guard works
- swap ratio remains near `50%` over large seeded simulations
- default state creation and migration normalization are correct
- copy formatting inserts fallback labels and tab separators
- duplicate detection is case-insensitive and cross-column
- Overwatch map defaults, visible maps, candidate intersection, and stored state migration

Manual browser checks covered keyboard navigation, centered single cards, wide and narrow Overwatch layouts, and state retention when switching tabs, including completing a map draw while the panel was hidden.
