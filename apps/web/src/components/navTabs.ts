/**
 * The four daily destinations.
 *
 * Review is deliberately absent. Spaced repetition is something the app
 * brings to the learner at the right moment — a permanent tab carrying a
 * number turns it into a debt they owe. It surfaces from Today and from
 * My Space, where it has a reason to exist.
 */
export interface NavTab {
  to: string;
  label: string;
  /** Only the exact path matches, so /my doesn't stay lit on /my/space. */
  end?: boolean;
}

export const NAV_TABS: NavTab[] = [
  { to: "/today", label: "Сегодня" },
  { to: "/course", label: "Курс" },
  { to: "/my", label: "Мой английский", end: true },
  { to: "/my/space", label: "Моё место" },
];
