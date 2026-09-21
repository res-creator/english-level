import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/today", label: "Today" },
  { to: "/learn", label: "Learn" },
  { to: "/review", label: "Review" },
  { to: "/friends", label: "Friends" },
  { to: "/profile", label: "Profile" },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive
              ? "bottom-nav__item bottom-nav__item--active"
              : "bottom-nav__item"
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
