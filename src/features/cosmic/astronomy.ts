import { J2000_UNIX_MS, planetDistancesAuAt, type Planet } from "./planetPositions.js";

export const LIGHT_KM_S = 299_792.458;
export const AU_KM = 149_597_870.7;
export const DAY_SECONDS = 86_400;
export const JULIAN_YEAR_SECONDS = 365.25 * DAY_SECONDS;
export const LIGHT_YEAR_KM = 9_460_730_472_580.8;

export const SOURCES = {
  constants: "https://ssd.jpl.nasa.gov/astro_par.html",
  planck: "https://doi.org/10.1051/0004-6361/201833880",
  rotation: "https://arxiv.org/abs/1810.09466",
  earth: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
  iss: "https://www.nasa.gov/reference/international-space-station/",
  geo: "https://ntrs.nasa.gov/citations/20205003902",
  moon: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  planets: "https://ssd.jpl.nasa.gov/planets/approx_pos.html",
  smallBodies: "https://www.esa.int/media/small-objects-in-the-solar-system",
  kuiper: "https://science.nasa.gov/solar-system/kuiper-belt/facts/",
  voyager: "https://science.nasa.gov/mission/voyager/interstellar-mission/",
  oort: "https://science.nasa.gov/solar-system/oort-cloud/facts/",
  nearbyStars: "https://science.nasa.gov/sun/facts/",
  barnard: "https://www.esa.int/gsp/ACT/doc/ARI/ARI%20Study%20Report/ACT-RPT-MAD-ARI-03-4102b-InterstellarTravels-Padova.pdf",
  sirius: "https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/",
  vega: "https://science.nasa.gov/asset/hubble/hubble-and-webb-observations-of-vega-circumstellar-disk/",
  polaris: "https://science.nasa.gov/asset/hubble/polaris-a-and-polaris-b/",
  orion: "https://arxiv.org/abs/0709.0485",
  galacticCenter: "https://science.nasa.gov/asset/hubble/compass-and-scale-file-for-galactic-center/",
  magellanic: "https://www.nasa.gov/universe/nasas-swift-produces-best-ultraviolet-maps-of-the-nearest-galaxies/",
  andromeda: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/",
  triangulum: "https://arxiv.org/abs/2304.00037",
} as const;

type Source = keyof typeof SOURCES;
export const MOTIONS = [
  { id: "galaxy", name: "우리 은하", frame: "우주배경복사 기준", speed: 565, source: "planck" },
  { id: "solar", name: "태양계", frame: "우리 은하 중심 공전 기준", speed: 230, source: "rotation" },
  { id: "earth", name: "지구", frame: "태양 공전 기준", speed: 29.78, source: "earth" },
  { id: "moon", name: "달", frame: "지구 공전 기준", speed: 1.022, source: "moon", decimals: 1 },
] satisfies readonly {
  id: string; name: string; frame: string; speed: number; source: Source; decimals?: number;
}[];

const KM_PER_UNIT = { km: 1, au: AU_KM, ly: LIGHT_YEAR_KM } as const;
type Unit = keyof typeof KM_PER_UNIT;
type Origin = "earth-launch" | "earth-surface" | "earth-center" | "earth-moon-barycenter" | "sun" | "solar-neighborhood";
type Reference = {
  name: string;
  distance: number;
  unit: Unit;
  origin: Origin;
  source: Source | null;
  note?: string;
};

const stellar = (name: string, distance: number, source: Source, note = "태양계 근방에서 잰 거리의 대표 근삿값"): Reference =>
  ({ name, distance, unit: "ly", origin: "solar-neighborhood", source, note });
const solar = (name: string, distance: number, source: Source, note: string): Reference =>
  ({ name, distance, unit: "au", origin: "sun", source, note });

const REFERENCES = {
  launch: { name: "지구에서 출발", distance: 0, unit: "km", origin: "earth-launch", source: null },
  iss: { name: "국제우주정거장 고도", distance: 400, unit: "km", origin: "earth-surface", source: "iss", note: "변하는 고도의 대표값(자료의 범위 370~460 km)" },
  geo: { name: "정지궤도 고도", distance: 35_786, unit: "km", origin: "earth-surface", source: "geo", note: "적도 지표면 위의 이론 고도" },
  moon: { name: "달", distance: 384_400, unit: "km", origin: "earth-center", source: "moon", note: "지구·달 중심 사이 궤도 장반경" },
  sun: { name: "태양", distance: 1, unit: "au", origin: "earth-center", source: "constants", note: "평균적인 지구·태양 거리의 비교 기준이며 현재 실거리는 아님" },
  asteroidsIn: solar("소행성대 진입", 2.1, "smallBodies", "주 소행성대 대표 안쪽 경계"),
  asteroidsOut: solar("소행성대 외곽", 3.3, "smallBodies", "주 소행성대 대표 바깥 경계"),
  kuiperIn: solar("카이퍼 벨트 진입", 30, "kuiper", "주 영역의 대표 안쪽 경계"),
  kuiperOut: solar("카이퍼 벨트 외곽", 50, "kuiper", "주 영역의 외곽. 산란 원반은 포함하지 않음"),
  heliopause: solar("태양권 경계", 122, "voyager", "보이저 1호가 건넌 방향의 관측값. 모든 방향의 경계가 아님"),
  oortIn: solar("오르트 구름 진입", 5_000, "oort", "NASA 안쪽 경계 추정 범위 2,000~5,000 AU 내에서 선택"),
  oortInterior: solar("오르트 구름 내부", 20_000, "smallBodies", "ESA의 내·외부 구름 구분을 참고한 비교값. 확정 경계가 아님"),
  oortOut: solar("오르트 구름 외곽", 100_000, "oort", "NASA 바깥 경계 추정 범위 10,000~100,000 AU 내에서 선택"),
  proxima: stellar("프록시마 센타우리", 4.24, "nearbyStars"),
  alpha: stellar("알파 센타우리 A·B", 4.37, "nearbyStars"),
  barnard: stellar("바너드별", 5.96, "barnard"),
  sirius: stellar("시리우스", 8.6, "sirius"),
  vega: stellar("베가", 25, "vega"),
  polaris: stellar("북극성", 430, "polaris"),
  orion: stellar("오리온 성운", 1_350, "orion", "오리온 성운 성단 시차 414 ± 7 pc를 광년으로 반올림"),
  center: stellar("우리 은하 중심", 26_000, "galacticCenter"),
  lmc: stellar("대마젤란 은하", 163_000, "magellanic"),
  smc: stellar("소마젤란 은하", 200_000, "magellanic"),
  andromeda: stellar("안드로메다 은하", 2_500_000, "andromeda"),
  triangulum: stellar("삼각형자리 은하", 2_740_000, "triangulum", "세페이드 관측 840 ± 11 kpc를 광년으로 반올림"),
} satisfies Record<string, Reference>;

const PLANET_NAMES = {
  mercury: "수성", venus: "금성", mars: "화성", jupiter: "목성",
  saturn: "토성", uranus: "천왕성", neptune: "해왕성",
} satisfies Record<Planet, string>;

type FixedReferenceId = keyof typeof REFERENCES;
export type ReferenceId = FixedReferenceId | Planet;
type Milestone = Reference & { id: ReferenceId; km: number };
const normalize = (reference: Reference) => reference.distance * KM_PER_UNIT[reference.unit];
const fixedMilestones: Milestone[] = (Object.keys(REFERENCES) as FixedReferenceId[]).map(id => {
  const reference: Reference = REFERENCES[id];
  return { id, ...reference, km: normalize(reference) };
});

export function milestonesAtDeparture(departure: number): readonly Milestone[] {
  const planets = planetDistancesAuAt(departure).map(({ id, au }): Milestone => ({
    id, name: PLANET_NAMES[id], distance: au, unit: "au", origin: "earth-moon-barycenter",
    source: "planets", km: au * AU_KM,
  }));
  return [...fixedMilestones, ...planets].sort((a, b) => a.km - b.km);
}

export const MILESTONES = milestonesAtDeparture(J2000_UNIX_MS);

const BANDS: readonly [name: string, start: FixedReferenceId, end?: FixedReferenceId][] = [
  ["지구 근처를 지나는 중", "launch", "moon"],
  ["태양계 안쪽을 지나는 중", "moon", "asteroidsIn"],
  ["소행성대 통과 중", "asteroidsIn", "asteroidsOut"],
  ["태양계 바깥쪽을 지나는 중", "asteroidsOut", "kuiperIn"],
  ["카이퍼 벨트 통과 중", "kuiperIn", "kuiperOut"],
  ["카이퍼 벨트 너머로 이동 중", "kuiperOut", "heliopause"],
  ["오르트 구름까지 이동 중", "heliopause", "oortIn"],
  ["오르트 구름 통과 중", "oortIn", "oortOut"],
  ["성간 공간을 지나는 중", "oortOut", "lmc"],
  ["은하 사이를 지나는 중", "lmc"],
];
export const REGIONS = BANDS.map(([name, start, end]) => ({
  name, startKm: normalize(REFERENCES[start]), endKm: end ? normalize(REFERENCES[end]) : Infinity,
}));

export function journeyAt(km: number, milestones = MILESTONES) {
  let low = 0, high = milestones.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (milestones[mid].km <= km) low = mid + 1;
    else high = mid;
  }
  const previous = milestones[Math.max(0, low - 1)];
  const earlier = low >= 2 ? milestones[low - 2] : null;
  const next = milestones[low] ?? null;
  const region = REGIONS.find(({ startKm, endKm }) => km >= startKm && km < endKm) ?? REGIONS[REGIONS.length - 1];
  return { earlier, previous, next, region };
}
