// Minimal subset of the Telegram WebApp JS API that this app relies on.
// Extend only as real usages need more of it.
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramBackButton {
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

export interface TelegramHapticFeedback {
  notificationOccurred: (type: "error" | "success" | "warning") => void;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  colorScheme: "light" | "dark";
  platform: string;
  ready: () => void;
  expand: () => void;
  /** Not present in every client/version — always optional-chain. */
  BackButton?: TelegramBackButton;
  HapticFeedback?: TelegramHapticFeedback;
  /** Opens Telegram's own native chooser for a t.me link — used for the
   * friend-invite share, so "who do I send this to" is the same picker
   * every other share in Telegram uses, not a custom UI. */
  openTelegramLink?: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
