import { Crosshair, Orbit, Route, Shuffle, Timer, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { loadObservatoryPreview } from "../dev/observatoryPreview";

type WorkspaceTool = {
  id: string;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  path: string;
  pinToHeader?: boolean;
  featured?: boolean;
  disabled?: boolean;
  newTab?: boolean;
};

export const LADDER_DISABLED = true;
export const REACTION_PATH = "/reaction-test";
export const OBSERVATORY_PATH = "/observatory";
export const COSMIC_PATH = "/cosmic-clock";

const workspaceTools: readonly WorkspaceTool[] = [
  {
    id: "shuffle",
    icon: Shuffle,
    title: "팀 섞기",
    subtitle: "팀 편성 · 맵 추첨",
    path: "/shuffle",
    pinToHeader: true,
    featured: true,
  },
  {
    id: "ladder",
    icon: Route,
    title: "사다리타기",
    path: "/ladder",
    pinToHeader: true,
    disabled: LADDER_DISABLED,
  },
  {
    id: "aim",
    icon: Crosshair,
    title: "에임 훈련장",
    path: "/aim-trainer",
    pinToHeader: true,
  },
  {
    id: "reaction",
    icon: Timer,
    title: "반응속도 테스트",
    path: REACTION_PATH,
    pinToHeader: true,
  },
];

export const WORKSPACE_TOOLS: readonly WorkspaceTool[] = [
  ...workspaceTools.filter(({ disabled }) => !disabled),
  ...workspaceTools.filter(({ disabled }) => disabled),
];

const featuredTool = WORKSPACE_TOOLS.find(({ featured }) => featured);
const playTools = WORKSPACE_TOOLS.filter((tool) => tool !== featuredTool);
const healingTools: readonly WorkspaceTool[] = [
  { id: "cosmic", icon: Orbit, title: "우주의 시계", path: COSMIC_PATH },
  ...(loadObservatoryPreview
    ? [{ id: "observatory", title: "펭귄 관찰소", path: OBSERVATORY_PATH, newTab: true }]
    : []),
];

function ToolArtwork({ id, icon: Icon }: Pick<WorkspaceTool, "id" | "icon">) {
  if (id === "shuffle" || (import.meta.env.DEV && id === "observatory")) {
    return (
      <img
        className="home-tool-mascot"
        src={`${import.meta.env.BASE_URL}img/penguin.png`}
        alt=""
        width={1600}
        height={1600}
        decoding="async"
      />
    );
  }

  if (id === "ladder") {
    return <span className="home-tool-ladder"><i /><i /><i /></span>;
  }

  if (id === "aim") {
    return <span className="home-tool-target"><i /></span>;
  }

  return Icon && <Icon className="home-tool-symbol" size={42} strokeWidth={1.65} />;
}

function HomeToolCard({ tool, heading: Heading }: { tool: WorkspaceTool; heading: "h2" | "h3" }) {
  const { id, path, title, subtitle, icon, disabled, newTab } = tool;
  const subtitleId = subtitle ? `tool-${id}-subtitle` : undefined;
  const newTabNote = newTab ? `tool-${id}-preview` : undefined;
  const linkProps = {
    className: `home-tool-link home-tool-link-${id}`,
    "aria-labelledby": `tool-${id}`,
    "aria-describedby": subtitleId ?? newTabNote,
  };
  const titleElement = <Heading id={`tool-${id}`} className="home-tool-title">{title}</Heading>;
  const card = (
    <article className="home-tool">
      {subtitle ? (
        <hgroup className="home-tool-heading">
          {titleElement}
          <p id={subtitleId} className="home-tool-subtitle">{subtitle}</p>
        </hgroup>
      ) : titleElement}
      <div className="home-tool-visual" aria-hidden="true"><ToolArtwork id={id} icon={icon} /></div>
    </article>
  );

  return disabled ? (
    <div {...linkProps} role="link" aria-disabled="true">{card}</div>
  ) : (
    <Link {...linkProps} to={path} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener" : undefined}>
      {card}
      {newTabNote && <span id={newTabNote} className="sr-only">개발용 미리보기, 새 탭에서 열림</span>}
    </Link>
  );
}

export function MenuPage() {
  return (
    <main className="workspace home-workspace">
      <h1 className="sr-only">50091</h1>
      <div className="home-tool-groups">
        {featuredTool && (
          <div className="home-featured">
            <HomeToolCard tool={featuredTool} heading="h2" />
          </div>
        )}
        <section aria-labelledby="home-play-tools">
          <h2 className="home-group-heading" id="home-play-tools">연습·미니게임</h2>
          <ul className="home-tools" role="list">
            {playTools.map((tool) => (
              <li key={tool.id}><HomeToolCard tool={tool} heading="h3" /></li>
            ))}
          </ul>
        </section>
        <section className="home-healing" aria-labelledby="home-healing-tools">
          <h2 className="home-group-heading" id="home-healing-tools">힐링</h2>
          <ul className="home-tools" role="list">
            {healingTools.map((tool) => (
              <li key={tool.id}><HomeToolCard tool={tool} heading="h3" /></li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
