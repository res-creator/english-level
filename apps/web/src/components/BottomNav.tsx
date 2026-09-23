import { NavLink } from "react-router-dom";
import { IconCourse, IconMine, IconReview, IconToday } from "../ui/icons.tsx";

// Four destinations, each backed by real functionality: what to do now,
// where it sits in the course, what needs refreshing, and what the
// learner already owns.
const TABS = [
  { to: "/today", label: "Сегодня", Icon: IconToday },
  { to: "/course", label: "Курс", Icon: IconCourse },
  { to: "/review", label: "Повторение", Icon: IconReview },
  { to: "/my", label: "Мой английский", Icon: IconMine },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isActive ? "nav-tab is-active" : "nav-tab"
          }
        >
          <span className="nav-tab__icon">
            <Icon size={21} />
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
