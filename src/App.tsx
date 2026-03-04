import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { MenuPage } from "./pages/MenuPage";

const DEV_ROUTE_LOADING_DELAY_MS = 650;

async function withDevRouteDelay<T>(loader: () => Promise<T>) {
  if (!import.meta.env.DEV) {
    return loader();
  }

  const [module] = await Promise.all([
    loader(),
    new Promise<void>((resolve) => window.setTimeout(resolve, DEV_ROUTE_LOADING_DELAY_MS)),
  ]);

  return module;
}

const ShufflePage = lazy(() =>
  withDevRouteDelay(() => import("./pages/ShufflePage")).then((module) => ({ default: module.ShufflePage }))
);
const AimTrainerPage = lazy(() =>
  withDevRouteDelay(() => import("./pages/AimTrainerPage")).then((module) => ({ default: module.AimTrainerPage }))
);
const GA_MEASUREMENT_ID = "G-65CWGN0X87";

function RouteLoadingFallback() {
  return (
    <div className="route-loading-shell" role="status" aria-live="polite" aria-label="화면 로딩 중">
      <div className="route-loading-card">
        <div className="route-loading-glow" />
        <div className="route-loading-header" />
        <div className="route-loading-line is-strong" />
        <div className="route-loading-line" />
        <div className="route-loading-line is-short" />
        <div className="route-loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function RoutePageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") {
      return;
    }

    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    window.gtag("config", GA_MEASUREMENT_ID, { page_path: pagePath });
  }, [location.hash, location.pathname, location.search]);

  return null;
}

function AppFrame() {
  const { theme, toggleTheme } = useTheme();
  const darkModeLogoSrc = `${import.meta.env.BASE_URL}img/50091.png`;
  const lightModeLogoSrc = `${import.meta.env.BASE_URL}img/50091-dark.png`;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    [darkModeLogoSrc, lightModeLogoSrc].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [darkModeLogoSrc, lightModeLogoSrc]);

  return (
    <>
      <div className="mx-auto mb-2 max-w-[1120px] app-top-controls px-3 pb-2 pt-4">
        <div className="theme-floating-controls">
          <button
            type="button"
            className="theme-image-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "라이트모드로 전환" : "다크모드로 전환"}
          >
            <span className="theme-image-stack" aria-hidden="true">
              <img
                className={`theme-image-toggle-img ${theme === "dark" ? "is-visible" : ""}`}
                src={darkModeLogoSrc}
                alt=""
                loading="eager"
                decoding="sync"
              />
              <img
                className={`theme-image-toggle-img ${theme === "light" ? "is-visible" : ""}`}
                src={lightModeLogoSrc}
                alt=""
                loading="eager"
                decoding="sync"
              />
            </span>
          </button>
          <span className="theme-mode-hint" aria-live="polite">
            {theme === "dark" ? "라이트모드" : "다크모드"}
          </span>
        </div>
      </div>
      <div key={location.pathname} className="page-transition-layer page-transition-enter">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/shuffle" element={<ShufflePage onNavigateMenu={() => navigate("/")} />} />
            <Route
              path="/aim-trainer"
              element={<AimTrainerPage onNavigateMenu={() => navigate("/")} theme={theme} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <RoutePageViewTracker />
      <AppFrame />
    </HashRouter>
  );
}

export default App;

