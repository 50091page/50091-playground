# Cosmic Clock

The `힐링` home card opens `#/cosmic-clock`. Below the light distance, the latest passed and next milestones each show a centred SVG symbol above the name. The thin line joins the outlines of the two symbols, while the luminous particle travels between their centres. The countdown uses the next milestone on the right. At the final milestone the particle stays at the centre of the last symbol and the countdown is hidden. The four distances appear below the centred `이동 거리` heading. The reset button requires confirmation. The Observatory is a local development prototype and is not deployed.

## Persistence and updates

- `50091.cosmic.departure.v1` stores only the departure time as a decimal string of Unix milliseconds. A valid timestamp, including one in the future, changes only on a confirmed reset. Missing or corrupt values start a new journey. If the initial write fails, the departure stays in tab memory and the page discloses that it cannot save. There is no sync between browsers, devices or origins.
- `clock.ts` advances from the wall-clock difference using `performance.now()` in the active tab. It resynchronizes when the tab becomes visible or wall time drifts by 2 s or more. Backward changes hold an open display rather than reverse it; a reload uses the corrected clock and can show less time. A stored departure in the future starts at zero until the clock catches up.
- The time display updates in whole seconds, using 24-hour days and Julian years of 365.25 days, not calendar anniversaries. Leading zero units are omitted. Each time unit stays in place when its digits change without changing their count. Distances default to km and switch to light-years from `10^15 km`, with scientific notation at extreme magnitudes. Display precision makes very large counters change less often.
- `CosmicClockPage.tsx`, its styles and astronomy data are lazy-loaded. A single frame loop samples light and all four celestial distances at up to 60 Hz and replaces only changed values. React renders summaries on second or milestone changes. Milestones are sorted once and the active interval is recomputed only when crossing a boundary. Hidden tabs cancel the frame request; unmount also removes listeners. There are no external astronomy APIs or background computation.
- The reset dialog warns the user that the previous journey cannot be recovered and initially focuses Cancel. Only after the confirmation time is saved does the app zero the elapsed time and distances, rebuild the path and countdown for the new departure, and replace the running loop without reloading. A failed write is reported in the dialog and leaves the existing departure and progress intact. Other storage entries are untouched.

## Calculations and sources

The celestial distance list shows only object names, numbers and units. Values are lighter than the primary light distance, align to the right without wrapping or ellipses, and units start at a shared position. In dark mode, the `이동 거리` heading uses a muted blue-gray with equal side rules. The countdown below the track separates its label and value with a clear gap and uses tabular numerals. Reference frames and calculation details are documented below rather than shown on the page.

Each accumulated path length is elapsed seconds times the representative speed in its own frame. They must not be added or interpreted as net displacement. These are not long-term physical predictions with invariant velocities. The CMB is a physical reference frame, not an absolute universal rest frame.

| Object | Speed | Reference frame and source |
| --- | ---: | --- |
| Milky Way | 565 km/s | Galactic centre with respect to the CMB, not the solar system or local group. [Planck 2018 results, table 3](https://doi.org/10.1051/0004-6361/201833880) publishes 565 ± 5 km/s. |
| Solar system | 230 km/s | Representative circular orbital speed about the Galactic centre. [Eilers et al. (2019)](https://arxiv.org/abs/1810.09466) find 229.0 ± 0.2 km/s locally, with roughly 2–5% systematic uncertainty. |
| Earth | 29.78 km/s | Mean solar orbital speed, [NASA Earth fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html). |
| Moon | 1.022 km/s | Mean geocentric orbital speed, [NASA Moon fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html). |

Light distance is elapsed seconds times the vacuum speed of `299,792.458 km/s`. The [NASA/JPL constants](https://ssd.jpl.nasa.gov/astro_par.html) give the IAU astronomical unit as `149,597,870.7 km` and Julian year as `31,557,600 s`, so one light-year is `9,460,730,472,580.8 km`.

## Distance references and bands

Theoretical light travel from Earth in an unspecified direction is compared with **reference lengths**. Planet labels use just the names, such as `화성` and `목성`. Other references retain their original surface altitudes, Moon and Sun distances, heliocentric radii, or distances from the solar neighbourhood.

For the seven planets other than Earth, the app approximates the straight-line distance at the saved departure time. It uses the [NASA JPL orbital model](https://ssd.jpl.nasa.gov/planets/approx_pos.html) to get both heliocentric positions at the same epoch, then takes the length of the difference vector. The Earth–Moon barycenter approximates Earth's centre, and the saved UTC timestamp approximates barycentric dynamical time (TDB). Table 1 covers 1800–2050; Tables 2a/2b cover the rest of the supported range (3000 BC–3000 AD). Outside that range, the app uses distances at J2000.0. It computes the distances on entry or reset, not from the running clock, so reloading does not move the benchmarks for the same departure. It does not track a real light trajectory, planet positions at arrival, or gravitational effects.

| Reference | Representative distances and original origin | Source and uncertainty |
| --- | --- | --- |
| Launch, ISS, GEO, Moon, Sun | Launch 0; surface altitudes 400 km / 35,786 km; Earth-centred 384,400 km / 1 AU | [NASA ISS altitude range 370–460 km](https://www.nasa.gov/reference/international-space-station/), [NASA GEO calculation](https://ntrs.nasa.gov/citations/20205003902), [NASA Moon fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html), [JPL AU](https://ssd.jpl.nasa.gov/astro_par.html). Not present-day distances. |
| Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune | Earth-to-planet distances at departure | [JPL approximate orbital model](https://ssd.jpl.nasa.gov/planets/approx_pos.html). Distances and milestone order can vary by departure date. |
| Main asteroid and Kuiper belts | Solar-centred 2.1–3.3 AU and 30–50 AU | [ESA small bodies](https://www.esa.int/media/small-objects-in-the-solar-system) and [NASA Kuiper Belt](https://science.nasa.gov/solar-system/kuiper-belt/facts/); main belt only, no scattered disk. |
| Heliopause | Solar-centred ~122 AU | [NASA Voyager 1](https://science.nasa.gov/mission/voyager/interstellar-mission/) crossing in one direction, not a universal boundary. |
| Oort Cloud | Solar-centred 5,000 AU entry, 20,000 AU interior benchmark, 100,000 AU outer boundary | The upper ends of [NASA's estimated ranges](https://science.nasa.gov/solar-system/oort-cloud/facts/) of 2,000–5,000 and 10,000–100,000 AU. The interior comparison point follows an [ESA subdivision](https://www.esa.int/media/small-objects-in-the-solar-system). |
| Stars | Solar vicinity: Proxima 4.24, Alpha Centauri A/B 4.37, Barnard 5.96, Sirius 8.6, Vega 25, Polaris 430 ly | Rounded benchmarks from [NASA Sun](https://science.nasa.gov/sun/facts/), [ESA interstellar distances](https://www.esa.int/gsp/ACT/doc/ARI/ARI%20Study%20Report/ACT-RPT-MAD-ARI-03-4102b-InterstellarTravels-Padova.pdf), [NASA Sirius](https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/), [NASA Vega](https://science.nasa.gov/asset/hubble/hubble-and-webb-observations-of-vega-circumstellar-disk/) and [NASA Polaris](https://science.nasa.gov/asset/hubble/polaris-a-and-polaris-b/). |
| Nebula and Galactic centre | Solar vicinity: Orion Nebula ~1,350 ly; Galactic centre 26,000 ly | [Menten et al. (2007), 414 ± 7 pc parallax](https://arxiv.org/abs/0709.0485) and [NASA Galactic centre](https://science.nasa.gov/asset/hubble/compass-and-scale-file-for-galactic-center/). |
| Other galaxies | Solar vicinity: LMC 163,000, SMC 200,000, Andromeda 2.5 million, Triangulum 2.74 million ly | [NASA Magellanic Clouds](https://www.nasa.gov/universe/nasas-swift-produces-best-ultraviolet-maps-of-the-nearest-galaxies/), [NASA M31](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/) and [Breuval et al. (2023), M33 840 ± 11 kpc](https://arxiv.org/abs/2304.00037). |

`astronomy.ts` normalizes lengths to km and sorts numerically. The particle is placed at `(light distance - segment start) / (segment end - segment start)`, clamped to 0–1. Equal distances use an endpoint instead of dividing by zero. When light reaches the next milestone, the particle starts from the left of the new segment at the actual relative distance. Bands still use `start ≤ distance < end`, but their labels are not shown. Distance keeps growing beyond the final benchmark. Light reaches the ISS and GEO benchmarks in under one second, so updates may pass them between frames.

Milestone types reuse SVG symbols. The 22–24px symbols mostly use approximately 1.5px strokes, with an 8px gap above the labels. Equal-width symbol and label groups fix the endpoints regardless of name length. Only the visible 1px line is inset to the artwork edges; the existing frame loop updates the particle's CSS `translate` along the full centre-to-centre distance at up to 60 Hz. The 6px white core and short four-point sparkle are always visible; only the approximately 34px violet halo shimmers on a 2.6-second cycle. Reduced motion disables the shimmer without changing the travel position.

## Verification

`npm test` checks new visits, 1 s, 10 s, 10 min, a day, 30 days, a year, ten years, thousands and millions of years; immediately before, at and after all boundaries; and sampling at 30–180 Hz, skipping delayed frames, clock corrections, suspension, resumption and disposal. Planet distances are checked against [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) geometric Earth-centred ranges in 2026, 2027 and 2075, including changes in landmark order by departure date and the out-of-range fallback.

Browser checks covered desktop and 320px/390px layouts, light and dark themes, persistence across reload and a real Chromium profile restart, and fallback when storage is blocked. In Chromium, hiding or leaving the page stopped clock updates, and a fresh reaction test visit did not request the clock module. Firefox and WebKit at 390px updated the counters without horizontal overflow.

Chrome, Firefox and WebKit verified safe default cancellation, Escape dismissal, preservation on a failed write, a confirmed restart at zero with one update loop, updated milestone transitions, and persistence after reload.

The redesign was compared at the same 30-day point and 1440px/390px widths. Chromium, Firefox and WebKit at 320px also verified timestamp preservation, alignment during live updates, long benchmark names, and large values beyond the final benchmark.

The horizontal path and stacked list were checked at one day, 30 days, one year, ten years and 100 years. At 320px the celestial numbers remained on one line and units shared an alignment point. A live crossing into the Oort Cloud updated the countdown and path without a reload.

Chrome, Firefox and WebKit verified midpoint placement, milestone and countdown transitions, the final endpoint, reset, and reduced motion. Chrome measured roughly 60 particle updates per second, with no layout passes in an isolated particle-effect check.

Chrome verified line contacts for all 14 symbol types and the rendered layout at 1440px and 390px. Substituting every milestone name at 280px and 320px left symbol centres and track position unchanged, without horizontal overflow.
