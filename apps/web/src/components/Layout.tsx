import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

/** Shell for the daily product (Today, Course). Lesson and placement
 * screens deliberately render outside this shell — see FocusShell. */
export function Layout() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

/** Full-height, chrome-free frame for focus mode: a lesson session, the
 * placement test and onboarding all hide the product navigation so the
 * learner has exactly one thing to do. */
export function FocusShell({
  top,
  footer,
  children,
}: {
  top?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="focus-shell">
      {top}
      <div className="focus-body">{children}</div>
      {footer ? <div className="focus-footer">{footer}</div> : null}
    </div>
  );
}
