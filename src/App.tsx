import { Suspense, lazy, useEffect, useLayoutEffect, useState } from "react";
import { HashRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { WorkspaceBackground } from "./components/WorkspaceBackground";
import type { HeaderPreviewVariant } from "./dev/HeaderPreviewControls";
import { useTheme } from "./hooks/useTheme";
import { LADDER_DISABLED, MenuPage, REACTION_PATH, WORKSPACE_TOOLS } from "./pages/MenuPage";

const ShufflePage = lazy(() =>
  import("./pages/ShufflePage").then((module) => ({ default: module.ShufflePage }))
);
const AimTrainerPage = lazy(() =>
  import("./pages/AimTrainerPage").then((module) => ({ default: module.AimTrainerPage }))
);
const LadderPage = lazy(() =>
  import("./pages/LadderPage").then((module) => ({ default: module.LadderPage }))
);
const ReactionTimePage = lazy(() =>
  import("./pages/ReactionTimePage").then((module) => ({ default: module.ReactionTimePage }))
);
const HeaderPreviewControls = import.meta.env.DEV ? lazy(() => import("./dev/HeaderPreviewControls")) : null;
const GA_MEASUREMENT_ID = "G-65CWGN0X87";

function isReactionPath(pathname: string) {
  return pathname.toLowerCase().replace(/\/+$/, "") === REACTION_PATH;
}

function RouteLoadingFallback() {
  return (
    <main className="workspace workspace-loading" role="status">화면을 불러오는 중입니다.</main>
  );
}

function RoutePageViewTracker() {
  const location = useLocation();
  const isReactionTest = isReactionPath(location.pathname);

  useLayoutEffect(() => {
    const analytics = window as Window & { "ga-disable-G-65CWGN0X87"?: boolean };
    analytics[`ga-disable-${GA_MEASUREMENT_ID}`] = isReactionTest;
  }, [isReactionTest]);

  useEffect(() => {
    if (isReactionTest || typeof window.gtag !== "function") {
      return;
    }

    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    window.gtag("config", GA_MEASUREMENT_ID, { page_path: pagePath });
  }, [isReactionTest, location.hash, location.pathname, location.search]);

  return null;
}

function AppFrame() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [headerVariant, setHeaderVariant] = useState<HeaderPreviewVariant>("original");

  return (
    <>
      <WorkspaceBackground />
      <header
        className={`workspace-header${isHome ? " is-home" : ""}`}
        data-header-preview={HeaderPreviewControls && isHome && headerVariant !== "original" ? headerVariant : undefined}
      >
        <div className="workspace workspace-header-inner">
          <Link to="/" className="workspace-brand" aria-label="50091 홈">
            <span className="workspace-brand-mark" aria-hidden="true"><i /></span>
            50091
          </Link>
          <nav className={`workspace-nav${isHome ? " is-hidden" : ""}`} aria-label="도구 메뉴">
            {WORKSPACE_TOOLS.filter(({ pinToHeader }) => pinToHeader).map(({ path, title, disabled }) => (
              disabled
                ? <span key={path} role="link" aria-disabled="true">{title}</span>
                : <NavLink key={path} to={path}>{title}</NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="workspace-theme"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "라이트모드로 전환" : "다크모드로 전환"}
            title={theme === "dark" ? "라이트모드로 전환" : "다크모드로 전환"}
          >
            <img src={`${import.meta.env.BASE_URL}img/50091.png`} alt="" hidden={theme !== "dark"} />
            <img src={`${import.meta.env.BASE_URL}img/50091-dark.png`} alt="" hidden={theme !== "light"} />
          </button>
        </div>
      </header>
      <div
        key={location.pathname}
        className={`workspace-route${isHome ? " is-home" : ""}${isReactionPath(location.pathname) ? " is-reaction-test" : ""}`}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/shuffle" element={<ShufflePage />} />
            <Route path="/aim-trainer" element={<AimTrainerPage theme={theme} />} />
            <Route path={REACTION_PATH} element={<ReactionTimePage />} />
            <Route path="/ladder" element={LADDER_DISABLED ? <Navigate to="/" replace /> : <LadderPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <footer className="workspace-footer">
        <div className="workspace workspace-footer-inner"><small>Made by 저둥저둥</small></div>
      </footer>
      {HeaderPreviewControls && isHome && (
        <Suspense fallback={null}>
          <HeaderPreviewControls value={headerVariant} onChange={setHeaderVariant} />
        </Suspense>
      )}
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

