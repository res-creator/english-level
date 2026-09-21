import { createContext, useEffect, useState, type ReactNode } from "react";
import type {
  MeResponse,
  TelegramAuthResponse,
} from "@english-level/contracts";
import { useTelegram } from "../telegram/useTelegram.ts";
import { buildDevInitData } from "./devTelegramFixture.ts";
import { getMe, telegramLogin } from "./authClient.ts";

export type AuthStatus =
  "loading" | "authenticated" | "unauthenticated" | "error";

export interface AuthContextValue {
  status: AuthStatus;
  user: MeResponse | null;
  next: TelegramAuthResponse["next"] | null;
  error: string | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { webApp, isMock } = useTelegram();
  const [value, setValue] = useState<AuthContextValue>({
    status: "loading",
    user: null,
    next: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const initData = isMock
          ? import.meta.env.DEV && webApp.initDataUnsafe.user
            ? await buildDevInitData(webApp.initDataUnsafe.user)
            : null
          : webApp.initData || null;

        if (!initData) {
          // No real Telegram session and no dev fixture available (e.g. a
          // production build opened outside Telegram) — fail closed rather
          // than attempting any kind of bypass.
          if (!cancelled) {
            setValue({
              status: "unauthenticated",
              user: null,
              next: null,
              error: null,
            });
          }
          return;
        }

        const login = await telegramLogin(initData);
        if (cancelled) return;
        if (!login) {
          setValue({
            status: "unauthenticated",
            user: null,
            next: null,
            error: null,
          });
          return;
        }

        const me = await getMe();
        if (cancelled) return;
        if (!me) {
          setValue({
            status: "unauthenticated",
            user: null,
            next: null,
            error: null,
          });
          return;
        }

        setValue({
          status: "authenticated",
          user: me,
          next: login.next,
          error: null,
        });
      } catch (err) {
        if (!cancelled) {
          setValue({
            status: "error",
            user: null,
            next: null,
            error: (err as Error).message,
          });
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [webApp, isMock]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
