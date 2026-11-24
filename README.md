# 50091

팀 섞기(리그 오브 레전드, 배틀그라운드, 오버워치), 오버워치 맵 추첨, 에임 훈련장, 반응속도 테스트와 관찰 콘텐츠인 우주의 시계를 제공하는 사이트입니다. 사다리타기는 비활성 상태입니다. 펭귄 관찰소는 로컬 시안으로, 공개 저장소와 운영 사이트에 포함하지 않습니다.

## 명세서

| 문서 | 한국어 | English |
| --- | --- | --- |
| 프로젝트 개요 | [공통 헤더, 메인 메뉴, 라우팅](spec/00_project_overview_ko.md) | [Project overview](spec/00_project_overview.md) |
| 팀 섞기 | [게임별 탭, 팀 편성, 오버워치 맵 추첨](spec/01_shuffle_tool_spec_ko.md) | [Team shuffle](spec/01_shuffle_tool_spec.md) |
| 에임 훈련장 | [훈련 화면, 과녁 옵션, 판정](spec/02_aim_trainer_spec_ko.md) | [Aim trainer](spec/02_aim_trainer_spec.md) |
| 반응속도 테스트 | [측정 방식, 기록, 한계](spec/03_reaction_time_spec_ko.md) | [Reaction time test](spec/03_reaction_time_spec.md) |
| 우주의 시계 | [시간, 거리 기준점, 과학 출처](spec/05_cosmic_clock_spec_ko.md) | [Cosmic clock](spec/05_cosmic_clock_spec.md) |

## 로컬 실행

`npm ci`로 의존성을 설치한 뒤 `npm run dev`로 실행합니다. `npm run build`는 배포용 빌드, `npm run preview`는 빌드 미리보기, `npm test`는 자동 테스트를 실행합니다.

## Team Shuffle Fairness

현재 팀 섞기 설정에서는 잠기지 않고 양쪽 이름이 모두 입력된 각 행을 독립적으로 `50%` 확률로 좌우 스왑합니다.
랜덤 시드 3개로 각각 `100,000회` 시뮬레이션하여 분포가 반반에 수렴하는지 검증했습니다.

| Scenario | Swapped | Stayed | Swap Ratio |
| --- | ---: | ---: | ---: |
| seed=50091 | 50,027 | 49,973 | 50.03% |
| seed=1337 | 49,829 | 50,171 | 49.83% |
| seed=20260304 | 49,781 | 50,219 | 49.78% |

- Acceptance rule: `49% ~ 51%` 범위를 통과 기준으로 사용
- Test command: `npm test`

## Audio Credits

- `Woodblock.wav` by `kwahmah_02`
  Source: https://freesound.org/s/268822/
  License: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)

- `doyng_G_1.R.aif` by `batchku`
  Source: https://freesound.org/s/10884/
  License: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
