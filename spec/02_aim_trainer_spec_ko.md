# 에임 훈련장 명세

## 범위

에임 훈련장(`#/aim-trainer`)은 PixiJS로 렌더링되는 클라이언트 사이드 반응 속도 미니게임이다. 플레이어는 반응형 경기장 안에 순차적으로 생성되는 과녁을 클릭한다.

주요 파일:

- `src/pages/AimTrainerPage.tsx`
- `src/features/aim/components/AimTrainerCanvas.tsx`
- `src/features/aim/components/AimTopHud.tsx`
- `src/features/aim/components/AimOptionsPanel.tsx`
- `src/features/aim/store/useAimStore.ts`
- `src/features/aim/constants.ts`
- `src/styles/tool-workspaces.css`

## 핵심 세션 규칙

- 게임당 총 타겟 수: `30`
- 기본 타겟 반지름: `15`
- 스폰 애니메이션 길이: `180ms`
- 미스 페이드 길이: `170ms`
- 설정 가능한 타겟 표시 시간:
  - 최소: `500ms`
  - 최대: `1000ms`
  - 기본값: `1000ms`
  - 조정 단위: `50ms`

## 게임 상태 모델

Zustand 스토어: `useAimStore`

### 세션 상태

- `score`
- `misses`
- `totalClicks`
- `offTargetClicks`
- `gameState`

### 같은 앱 실행 동안 유지되는 옵션 상태

- `targetDuration`
- `targetStyle`
- `targetSizeMultiplier`

### 게임 상태 값

- `idle`
- `playing`
- `paused`
- `finished`

## 스토어 액션

### 세션 흐름

- `startGame()`
  - 점수 관련 카운터를 초기화한다
  - 현재 옵션은 유지한다
  - 상태를 `playing`으로 전환한다
- `pauseGame()`
  - `playing` 상태에서만 동작한다
- `resumeGame()`
  - `paused` 상태에서만 동작한다
- `finishGame()`
  - 상태를 `finished`로 전환한다
- `resetGame()`
  - 카운터와 게임 상태를 `idle`로 초기화한다
  - 옵션은 유지한다

### 점수 처리

- `registerHit()`
  - `totalClicks` 증가
  - `score` 증가
- `registerMiss()`
  - `misses` 증가
- `registerOffTargetClick()`
  - `totalClicks` 증가
  - `offTargetClicks` 증가

### 옵션

- `setTargetStyle(style)`
- `setTargetSizeMultiplier(multiplier)`
- `setTargetLifetimeMs(duration)`
  - 설정 가능한 최소/최대 범위로 clamp 처리

## 경기장 레이아웃

페이지는 `ResizeObserver`를 이용해 사용 가능한 경기장 영역을 측정한다.

크기 규칙:

- 너비는 경기장 컨테이너의 실제 너비에 맞춘다. 코드의 하한은 `1px`이다.
- 높이는 실측 너비의 `56%`를 내림한 뒤 `320px` ~ `560px` 범위로 제한한다.

좁은 화면에서도 가로 너비는 컨테이너에 맞고, 높이는 훈련에 필요한 최소 높이를 유지한다.

## 렌더링 모델

플레이필드는 Pixi로 그려진다.

- 둥근 사각형 경기장 배경
- 경기장 전체 그리드 라인
- 한 번에 하나의 활성 타겟
- 경기장 전체를 덮는 포인터 인터랙션 레이어

테마에 따라 경기장 색상이 달라진다.

- 다크 모드: 더 어두운 배경과 강한 그리드 대비
- 라이트 모드: 더 밝은 배경과 부드러운 그리드 대비

## 타겟 생명주기

각 타겟이 가지는 정보:

- 위치
- 반지름
- 스폰 시각
- 현재 phase
- phase 전환 시각
- 히트 여부

### 스폰 위치

새 타겟은 경기장 안쪽 여백을 둔 영역에서 무작위 위치로 생성된다.

- 가로 여백: `64px`
- 세로 여백: `64px + 28px`에 해당하는 상단 보정

이 규칙은 타겟이 캔버스 가장자리나 상단 HUD와 너무 겹치지 않게 만든다.

### Phase

- `spawning`
- `active`
- `hit`
- `miss`

### 생명주기 규칙

1. 플레이가 시작되면 첫 타겟이 즉시 생성된다.
2. `spawning` 동안 타겟은 작은 크기에서 시작해 자연스럽게 커진다.
3. `180ms`가 지나면 `active` 상태가 된다.
4. 수명이 끝나기 직전까지 맞지 않으면 `miss` 상태로 전환된다.
5. 플레이어가 클릭에 성공하면 `hit` 상태로 전환된다.
6. 하나의 타겟이 처리되면 다음 타겟은 대략 `targetDuration * 2` 주기를 기준으로 생성된다.
7. 처리 완료된 타겟이 `30`개가 되면 게임이 종료되고 `finished`가 된다.

## 판정

포인터 처리 로직은 `onPointerDown`에 있다.

규칙:

- 클릭 판정은 `playing` 상태일 때만 의미가 있다
- 생성 중이거나 활성 상태인 과녁을 맞힐 수 있다. 이미 처리 중인 `hit` 또는 `miss` 과녁은 다시 맞힐 수 없다.
- 현재 맞출 수 있는 타겟이 없으면 off-target 클릭으로 처리한다
- 히트 판정 반경은 `target.radius * 1.166`
- 명중 시:
  - 히트 사운드 재생
  - 점수 증가
  - 현재 타겟을 `hit` 상태로 전환
- 빗맞은 클릭 시:
  - 미스 사운드 재생
  - off-target 클릭 수 증가

타겟이 시간 만료로 사라지면:

- `registerMiss()`가 호출된다
- 그래도 처리된 타겟 수는 1 증가한다

## 일시정지 동작

Escape 키 처리:

- 플레이 중 `Escape`를 누르면 일시정지한다

일시정지 상태 규칙:

- 일시정지 시점을 기록해 타이머를 사실상 정지시킨다
- 재개 시 타겟 타임스탬프와 다음 스폰 시점을 일시정지 시간만큼 앞으로 민다
- 따라서 일시정지 중에는 타겟이 몰래 만료되지 않는다

## 화면과 상태별 조작

공통 헤더 아래에 훈련 카드 하나를 배치한다. 별도의 페이지 제목 배너는 없으며, 훈련 카드 안에 HUD와 조작 버튼, Pixi 경기장이 들어간다.

### 상단 HUD

표시 정보:

- `점수`와 `남은 과녁`: 두 자리 표기
- 현재 과녁 `유지 시간` (ms)

남은 수 계산식:

- `TOTAL_TARGETS - (score + misses)`

### 플레이 중

- 일시정지 버튼이 보인다

### 일시정지 상태

`일시정지` 오버레이에서 다음 버튼이 보인다.

- `계속하기`
- `새 게임`
- `훈련 메뉴`

`훈련 메뉴`는 다른 페이지로 이동하지 않고 `resetGame()`으로 초기 훈련 화면에 돌아간다. 과녁 옵션은 유지한다.

### 대기 또는 종료 상태

대기 화면에는 펭귄 이미지와 `훈련 시작`, 종료 화면에는 과녁 아이콘과 `다시 시작`이 보인다.

툴바의 `과녁 설정` 버튼은 `idle`, `finished`에만 표시되며, 패널은 경기장 위에 펼쳐진다.

## 옵션 패널

설정 가능한 값:

- 타겟 스타일:
  - Ember
  - Mint
  - Violet
  - Sunset
  - Frost
- 타겟 크기:
  - `0.5x`
  - `1.0x`
  - `1.5x`
  - `2.0x`
- 과녁 유지 시간:
  - `500ms` ~ `1000ms` 범위 슬라이더

동작:

- 색상을 선택하면 패널을 닫고 `과녁 설정` 버튼에 포커스를 돌려준다.
- 크기 또는 유지 시간 변경은 패널을 닫지 않는다.
- 플레이 중이거나 일시정지 상태가 되면 패널을 닫는다.

## 오디오

오디오 파일:

- `/sound/hit.wav`
- `/sound/miss.wav`

동작:

- 페이지 마운트 시 미리 로드한다
- 재생할 때마다 `currentTime = 0`으로 되감고 다시 재생한다
- 오디오 재생 실패는 조용히 무시한다
- 경기장 아래 `사운드 출처`에서 출처와 라이선스를 펼쳐 볼 수 있다.

## 이동과 정리

- 공통 헤더의 `50091` 홈 링크로 메인에 돌아간다. 별도의 뒤로가기 버튼은 없다.
- 페이지를 떠날 때 `resetGame()`이 점수·카운터·게임 상태를 초기화한다. 선택한 과녁 색상·크기·유지 시간은 Zustand 메모리에 남아 같은 앱에서 다시 방문할 때 유지된다.

## 현재 공백 영역

새로고침 이후 유지되지 않는 값:

- score
- misses
- 선택한 옵션

현재 자동 테스트가 없는 영역:

- Pixi 포인터 히트 판정
- 일시정지/재개 타이밍 보정 정확성
- 반응형 경기장 크기 계산
- 오디오 재생 동작
