import { createContext, useEffect, useMemo, type ReactNode } from "react";
import { resolveTelegramWebApp } from "./webapp";
import type { TelegramUser, TelegramWebApp } from "./types";

export interface TelegramContextValue {
  webApp: TelegramWebApp;
  user: TelegramUser | undefined;
  isMock: boolean;
}

export const TelegramContext = createContext<TelegramContextValue | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const value = useMemo<TelegramContextValue>(() => {
    const { webApp, isMock } = resolveTelegramWebApp();
    return { webApp, user: webApp.initDataUnsafe.user, isMock };
  }, []);

  useEffect(() => {
    value.webApp.ready();
    value.webApp.expand();
  }, [value.webApp]);

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}
