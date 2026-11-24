# Reaction Time Test

Open `#/reaction-test` from the home minigames section or the shared tool navigation. The whole board is the start, response, and continue control. It accepts a mouse, touch, pen, or Enter and Space when the board has focus.

The board uses the shared content width and keeps the same height in every state. On typical desktops it targets 65% of the viewport height, bounded by 440–680 px. Mobile and short, wide screens use lower minimums, and the board can shrink to fit between the header and footer. The two-column summary is retained on short, wide screens, and scrolling keeps content reachable when space is too limited. This layout uses neither fullscreen mode nor JavaScript sizing.

## Gameplay and records

- Each attempt draws a new delay of 1,500–5,000 ms. The first input after the red board changes to green is recorded. False starts are counted separately and do not count toward completion.
- A rapid repeat at the same spot after a result or false start is ignored; a distinct press elsewhere can retry immediately.
- A hidden tab, lost window focus, incompatible timestamp, or substantial rendering delay invalidates the current attempt without discarding previous valid attempts. Leaving the tool ends the session.
- Only single-input sessions are eligible for a personal best average. Mouse, touch, pen, and keyboard bests are stored separately in the browser.
- After five valid responses, the progress counter is replaced by the average, personal best and false-start count, five attempts with no visible heading, and a restart button. The median, fastest, and slowest times are still calculated but not shown as separate statistics.
- Fastest highlights are unchanged. Only the digits of attempts tied for slowest get a new highlight: muted coral `#E5A1A6` in dark mode and the existing higher-contrast red in light mode. If all unrounded times are identical, no slowest highlight is applied.
- Beneath the average, a centered row shows `내 최고 기록 · 201 ms` and then `조기 클릭 0회`, without naming the input device. A first or improved best shows `최고 기록 갱신!` in place of the personal best.

## Timing and limits

- The wait timer queues the first `requestAnimationFrame()`. That callback commits the cue directly to the DOM and reads `performance.now()` immediately afterward. React rendering and CSS animations are outside the cue and input paths.
- The score is the compatible native `pointerdown` or `keydown` timestamp minus the onset estimate, never the handler execution time. Results are rounded to whole milliseconds only for display.
- The attempt is invalidated when the cue frame is over 150 ms late or the first follow-up frame is more than 120 ms after the cue update. Slow responses to a normally presented cue are still recorded.
- Gameplay needs no server and never accesses storage while timing. Personal bests are saved after the session, and site Google Analytics transmissions are disabled while on the test route.
- A DOM update does not establish when pixels lit up. Browser timer resolution, refresh rate, OS, and input hardware can affect results. Compare results on the same device and browser; no hardware-latency adjustment is applied. [Event.timeStamp](https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp) · [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)

## Verification

- `npm test` checks the calculation with controlled timestamps, false starts, repeat inputs, delayed delivery, focus and rendering interruptions, statistics, and callback cleanup.
- The production preview was checked in Chrome with mouse, keyboard, touch emulation, offline mode, reduced motion, 6× CPU slowdown, simulated blur and visibility events, and listener teardown on navigation. Native mouse timestamps were also checked in Firefox and WebKit.
- A Chrome trace showed no forced layout in the timing path. A deliberate 100 ms input-handler delay did not increase the score, while a roughly 200 ms stall just after the cue invalidated the attempt. Physical latency and real touchscreen hardware were not tested.
