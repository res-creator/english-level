import { NavLink } from "react-router-dom";
import { IconHome, IconPath, IconSpeechCheck, IconSun } from "../ui/icons.tsx";
import { NAV_TABS } from "./navTabs.ts";

const ICONS: Record<string, (props: { size?: number }) => JSX.Element> = {
  "/today": IconSun,
  "/course": IconPath,
  "/my": IconSpeechCheck,
  "/my/space": IconHome,
};

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_TABS.map(({ to, label, end }) => {
        const Icon = ICONS[to] ?? IconSun;
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive ? "nav-tab is-active" : "nav-tab"
            }
          >
            <span className="nav-tab__icon">
              <Icon size={22} />
            </span>
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
