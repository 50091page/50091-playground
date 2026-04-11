import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MapPinned, RotateCcw, Shuffle } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useToastNotice } from "../../hooks/useToastNotice";
import {
  createDefaultOverwatchMapState,
  getCandidateOverwatchMaps,
  migrateOverwatchMapState,
  OVERWATCH_MAP_MODES,
  OVERWATCH_MAPS_BY_MODE,
  OVERWATCH_MODE_META,
  type OverwatchMapName,
  type OverwatchMapMode,
} from "./overwatchMaps";

function pickRandomMap(maps: OverwatchMapName[]) {
  return maps[Math.floor(Math.random() * maps.length)];
}

export function OverwatchMapTool() {
  const [state, setState] = useLocalStorage("shuffle.overwatch.map.state.v1", createDefaultOverwatchMapState(), {
    migrate: migrateOverwatchMapState,
  });
  const { toastMessage, showNotice } = useToastNotice();
  const [isDrawing, setIsDrawing] = useState(false);
  const [displayMap, setDisplayMap] = useState<OverwatchMapName | null>(state.lastDrawnMap);
  const drawIntervalRef = useRef<number | null>(null);
  const drawTimeoutRef = useRef<number | null>(null);
  const overwatchIconSrc = `${import.meta.env.BASE_URL}img/overwatch.png`;

  const candidateMaps = useMemo(
    () => getCandidateOverwatchMaps(state.selectedModes, state.selectedMaps),
    [state.selectedMaps, state.selectedModes]
  );

  useEffect(() => {
    if (!isDrawing) {
      setDisplayMap(state.lastDrawnMap);
    }
  }, [isDrawing, state.lastDrawnMap]);

  useEffect(() => {
    return () => {
      if (drawIntervalRef.current !== null) {
        window.clearInterval(drawIntervalRef.current);
      }
      if (drawTimeoutRef.current !== null) {
        window.clearTimeout(drawTimeoutRef.current);
      }
    };
  }, []);

  const toggleMode = (mode: OverwatchMapMode) => {
    setState((prev) => ({
      ...prev,
      selectedModes: prev.selectedModes.includes(mode)
        ? prev.selectedModes.filter((value) => value !== mode)
        : [...prev.selectedModes, mode],
    }));
  };

  const toggleMap = (mapName: OverwatchMapName) => {
    setState((prev) => ({
      ...prev,
      selectedMaps: prev.selectedMaps.includes(mapName)
        ? prev.selectedMaps.filter((value) => value !== mapName)
        : [...prev.selectedMaps, mapName],
    }));
  };

  const resetState = () => {
    setState(createDefaultOverwatchMapState());
    showNotice("맵 풀을 기본값으로 되돌렸습니다.");
  };

  const drawRandomMap = () => {
    if (candidateMaps.length === 0) {
      showNotice("뽑을 수 있는 맵이 없습니다. 전장 형태나 맵 선택을 확인해 주세요.");
      return;
    }

    if (drawIntervalRef.current !== null) {
      window.clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
    if (drawTimeoutRef.current !== null) {
      window.clearTimeout(drawTimeoutRef.current);
      drawTimeoutRef.current = null;
    }

    setIsDrawing(true);
    let currentIndex = Math.floor(Math.random() * candidateMaps.length);
    setDisplayMap(candidateMaps[currentIndex]);
    drawIntervalRef.current = window.setInterval(() => {
      currentIndex = (currentIndex + 1) % candidateMaps.length;
      setDisplayMap(candidateMaps[currentIndex]);
    }, 35);

    const nextMap = pickRandomMap(candidateMaps);
    drawTimeoutRef.current = window.setTimeout(() => {
      if (drawIntervalRef.current !== null) {
        window.clearInterval(drawIntervalRef.current);
        drawIntervalRef.current = null;
      }
      drawTimeoutRef.current = null;
      setDisplayMap(nextMap);
      setState((prev) => ({
        ...prev,
        lastDrawnMap: nextMap,
        drawCount: prev.drawCount + 1,
      }));
      setIsDrawing(false);
    }, 1040);
  };

  return (
    <>
      <section className={`shv0-card is-overwatch owm0-card${isDrawing ? " is-busy" : ""}`}>
        <header className="shv0-card-header">
          <div className="shv0-card-header-left">
            <div className="shv0-card-icon-wrap">
              <div className="shv0-card-icon">
                <img src={overwatchIconSrc} alt="" className="shv0-card-icon-img shv0-card-icon-img-overwatch" />
              </div>
            </div>
            <div className="shv0-card-title-wrap">
              <h2 className="shv0-card-title">오버워치 맵 랜덤</h2>
            </div>
          </div>
          <div className="shv0-card-header-right">
            <button type="button" className="shv0-clear-btn" onClick={resetState} aria-label="맵 설정 초기화">
              <RotateCcw size={14} />
            </button>
          </div>
        </header>

        <div className="shv0-card-content">
          <section className="owm0-block">
            <div className="owm0-head">
              <h3 className="owm0-title">모드 선택</h3>
              <span className="owm0-meta">{state.selectedModes.length}개 선택</span>
            </div>
            <div className="owm0-chip-grid">
              {OVERWATCH_MAP_MODES.map((mode) => {
                const isSelected = state.selectedModes.includes(mode);
                const meta = OVERWATCH_MODE_META[mode];

                return (
                  <button
                    type="button"
                    key={mode}
                    className={`owm0-chip${isSelected ? " is-selected" : ""}`}
                    style={{ "--owm0-mode-accent": meta.accent } as CSSProperties}
                    onClick={() => toggleMode(mode)}
                  >
                    <span className="owm0-chip-label">{mode}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="owm0-block">
            <div className="owm0-head">
              <h3 className="owm0-title">맵 선택</h3>
              <span className="owm0-meta">{candidateMaps.length}개 후보</span>
            </div>

            <div className="owm0-group-stack">
              {state.selectedModes.map((mode) => (
                <section
                  className="owm0-map-group"
                  key={mode}
                  style={{ "--owm0-mode-accent": OVERWATCH_MODE_META[mode].accent } as CSSProperties}
                >
                  <div className="owm0-group-head">
                    <span className="owm0-group-title">{mode}</span>
                    <span className="owm0-group-count">
                      {
                        OVERWATCH_MAPS_BY_MODE[mode].filter((mapName) => state.selectedMaps.includes(mapName)).length
                      }
                      /{OVERWATCH_MAPS_BY_MODE[mode].length}
                    </span>
                  </div>
                  <div className="owm0-map-grid">
                    {OVERWATCH_MAPS_BY_MODE[mode].map((mapName) => {
                      const isSelected = state.selectedMaps.includes(mapName);

                      return (
                        <button
                          type="button"
                          key={mapName}
                          className={`owm0-map-chip${isSelected ? " is-selected" : ""}`}
                          onClick={() => toggleMap(mapName)}
                        >
                          {mapName}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="owm0-result">
            <div className="owm0-result-head">
              <span className="owm0-title">랜덤 결과</span>
              <span className="owm0-meta">{state.drawCount}회 뽑음</span>
            </div>
            <div className={`owm0-result-card${displayMap ? " has-result" : ""}${isDrawing ? " is-drawing" : ""}`}>
              <MapPinned size={16} />
              <strong>{displayMap ?? "맵을 뽑으면 여기 표시됩니다."}</strong>
            </div>
          </section>
        </div>

        <footer className="shv0-footer">
          <div className="shv0-primary-action">
            <button
              type="button"
              className={`shv0-shuffle-btn${isDrawing ? " is-busy" : ""}`}
              onClick={drawRandomMap}
              disabled={isDrawing}
            >
              <Shuffle size={15} />
              {isDrawing ? "뽑는 중..." : "맵 뽑기"}
            </button>
          </div>

          <div className="shv0-actions">
            <button type="button" className="shv0-action-btn is-outline" onClick={resetState} disabled={isDrawing}>
              <RotateCcw size={14} />
              초기화
            </button>
          </div>
        </footer>
      </section>

      {toastMessage ? (
        <div className="toast-notice" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </>
  );
}
