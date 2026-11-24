import { useId, useState, type KeyboardEvent } from "react";
import { LolTool } from "../features/lol/LolTool";
import { OverwatchSection } from "../features/overwatch/OverwatchSection";
import { PubgTool } from "../features/pubg/PubgTool";

const GAMES = [
  { id: "lol", label: "리그 오브 레전드", Panel: LolTool },
  { id: "pubg", label: "배틀그라운드", Panel: PubgTool },
  { id: "overwatch", label: "오버워치", Panel: OverwatchSection },
] as const;

type Game = (typeof GAMES)[number]["id"];
const hasNativeFocusGroup = typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;

function handleGameTabKey(event: KeyboardEvent<HTMLDivElement>) {
  const { key, altKey, ctrlKey, metaKey, shiftKey } = event;
  if (altKey || ctrlKey || metaKey || shiftKey) return;

  const isEdgeKey = key === "Home" || key === "End";
  if (!isEdgeKey && (hasNativeFocusGroup || (key !== "ArrowLeft" && key !== "ArrowRight"))) return;

  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="tab"]'));
  const current = tabs.findIndex((tab) => tab === event.target);
  if (current === -1) return;

  const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
  const step = (key === "ArrowRight") !== rtl ? 1 : -1;
  const next = key === "Home" ? 0 : key === "End" ? tabs.length - 1 : (current + step + tabs.length) % tabs.length;

  event.preventDefault();
  tabs[next].focus();
}

export function ShufflePage() {
  const [activeGame, setActiveGame] = useState<Game>("lol");
  const tabPrefix = useId();

  return (
    <main className="workspace tool-workspace">
      <h1 className="sr-only">팀 섞기</h1>
      <div
        className="shv0-game-tabs"
        role="tablist"
        aria-label="게임 선택"
        {...{ focusgroup: "tablist nomemory" }}
        onKeyDown={handleGameTabKey}
      >
        {GAMES.map(({ id, label }) => {
          const isSelected = id === activeGame;

          return (
            <button
              key={id}
              id={`${tabPrefix}-${id}`}
              className="shv0-game-tab"
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={hasNativeFocusGroup ? undefined : isSelected ? 0 : -1}
              {...(isSelected ? { focusgroupstart: "" } : {})}
              onFocus={() => setActiveGame(id)}
              onClick={() => setActiveGame(id)}
            >
              {label}
            </button>
          );
        })}
      </div>
      {GAMES.map(({ id, Panel }) => (
        <section
          key={id}
          className={id === "overwatch" ? undefined : "shv0-single-game"}
          role="tabpanel"
          aria-labelledby={`${tabPrefix}-${id}`}
          hidden={id !== activeGame}
        >
          <Panel />
        </section>
      ))}
    </main>
  );
}
