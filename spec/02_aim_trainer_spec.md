# Aim Trainer Specification

## Scope

The aim trainer (`#/aim-trainer`) is a client-side reaction minigame rendered with PixiJS. The player clicks a sequence of targets inside a responsive arena.

Primary files:

- `src/pages/AimTrainerPage.tsx`
- `src/features/aim/components/AimTrainerCanvas.tsx`
- `src/features/aim/components/AimTopHud.tsx`
- `src/features/aim/components/AimOptionsPanel.tsx`
- `src/features/aim/store/useAimStore.ts`
- `src/features/aim/constants.ts`
- `src/styles/tool-workspaces.css`

## Core Session Rules

- Total targets per game: `30`
- Base target radius: `15`
- Spawn animation duration: `180ms`
- Miss fade duration: `170ms`
- Configurable target visible duration:
  - min: `500ms`
  - max: `1000ms`
  - default: `1000ms`
  - step: `50ms`

## Game State Model

Zustand store: `useAimStore`

### Session State

- `score`
- `misses`
- `totalClicks`
- `offTargetClicks`
- `gameState`

### Options Retained Within The Same App Session

- `targetDuration`
- `targetStyle`
- `targetSizeMultiplier`

### Game State Values

- `idle`
- `playing`
- `paused`
- `finished`

## Store Actions

### Session Flow

- `startGame()`
  - resets score counters
  - preserves current options
  - enters `playing`
- `pauseGame()`
  - only works from `playing`
- `resumeGame()`
  - only works from `paused`
- `finishGame()`
  - enters `finished`
- `resetGame()`
  - resets counters and game state to `idle`
  - preserves selected options

### Scoring

- `registerHit()`
  - increments `totalClicks`
  - increments `score`
- `registerMiss()`
  - increments `misses`
- `registerOffTargetClick()`
  - increments `totalClicks`
  - increments `offTargetClicks`

### Options

- `setTargetStyle(style)`
- `setTargetSizeMultiplier(multiplier)`
- `setTargetLifetimeMs(duration)`
  - clamps the value into the configured min/max range

## Arena Layout

The page measures the available arena container with `ResizeObserver`.

Sizing rules:

- width follows the measured arena container, with a code-level lower bound of `1px`
- height is `56%` of the measured width, rounded down and clamped to `320px`–`560px`

The canvas fits the container on narrow screens while preserving the minimum playable height.

## Rendering Model

The playfield is rendered in Pixi:

- rounded rectangle arena background
- grid lines across the arena
- one active target at a time
- pointer interaction layer covering the full arena

Theme affects arena colors:

- dark mode uses darker fills and stronger grid contrast
- light mode uses brighter fills and softer grid contrast

## Target Lifecycle

Each target has:

- position
- radius
- spawn timestamp
- current phase
- phase timestamp
- hit flag

### Spawn Placement

New targets are created with random positions inside a safe inset area:

- horizontal margin: `64px`
- vertical margin: `64px + 28px` effective top offset

This avoids placing targets too close to the canvas edges and top HUD.

### Phases

- `spawning`
- `active`
- `hit`
- `miss`

### Lifecycle Rules

1. When play starts, the first target is created immediately.
2. During `spawning`, the target animates from smaller scale to full size.
3. After `180ms`, phase changes to `active`.
4. Near the end of its lifetime, if not hit, the target enters `miss`.
5. If the player hits it, the phase becomes `hit`.
6. After a target resolves, the next target spawns after a delay so each target cycle occupies roughly `targetDuration * 2`.
7. After `30` resolved targets, the session completes and enters `finished`.

## Hit Detection

Pointer logic lives in `onPointerDown`.

Rules:

- clicks only matter in `playing` state
- spawning and active targets are hittable; targets in `hit` or `miss` cannot be hit again
- if there is no hittable target, the click counts as off-target
- hit distance threshold is `target.radius * 1.166`
- successful hit:
  - plays hit audio
  - increments score
  - transitions current target to `hit`
- unsuccessful click:
  - plays miss audio
  - increments off-target click count

If a target expires without being hit:

- `registerMiss()` is called
- the resolved-target counter still advances

## Pause Behavior

Escape key handling:

- pressing `Escape` during play pauses the game

Paused state behavior:

- active timestamps are frozen by recording the pause time
- on resume, target timestamps and next spawn time are shifted forward by the pause duration
- this prevents the target from expiring during pause

## Workspace And State Controls

The shared header sits above a single training card, with no separate page-title banner. The card contains the HUD, controls, and the Pixi arena.

### Top HUD

Displays:

- `점수` (score) and `남은 과녁` (remaining targets), displayed with two digits
- `유지 시간` (target lifetime), in milliseconds

Remaining count is computed as:

- `TOTAL_TARGETS - (score + misses)`

### Playing

- `일시정지` (pause) button is visible

### Paused

The `일시정지` overlay shows:

- `계속하기` (continue)
- `새 게임` (new game)
- `훈련 메뉴` (training menu)

`훈련 메뉴` calls `resetGame()` to return to the idle screen without navigating away or changing the target options.

### Idle Or Finished

The idle overlay shows a penguin and `훈련 시작` (start training). The finished overlay shows a reticle and `다시 시작` (restart).

The toolbar's `과녁 설정` (target settings) button is available only while idle or finished. Its panel opens above the arena.

## Option Panel

Configurable values:

- target style:
  - Ember
  - Mint
  - Violet
  - Sunset
  - Frost
- target size:
  - `0.5x`
  - `1.0x`
  - `1.5x`
  - `2.0x`
- target lifetime:
  - range slider from `500ms` to `1000ms`

Behavior:

- selecting a color closes the panel and returns focus to `과녁 설정`
- changing size or lifetime leaves the panel open
- the panel closes when the game enters `playing` or `paused`

## Audio

Audio files:

- `/sound/hit.wav`
- `/sound/miss.wav`

Behavior:

- preloaded on page mount
- playback restarts from `0` on each trigger
- audio failures are ignored silently
- `사운드 출처` below the arena expands to show credits and licenses

## Navigation And Cleanup

- The global `50091` link returns home; there is no separate back button.
- Unmounting the page calls `resetGame()` to clear the session counters and reset the game to idle. Target color, size, and lifetime stay in the in-memory Zustand store when returning within the same app session.

## Current Gaps

Not currently persisted across reloads:

- score
- misses
- selected options

Not currently covered by automated tests:

- Pixi pointer hit detection
- pause/resume timing correctness
- responsive arena sizing
- audio playback behavior
