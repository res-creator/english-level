import { createContext, useEffect, useState, type ReactNode } from "react";
import type {
  MeResponse,
  TelegramAuthResponse,
} from "@english-level/contracts";
import { useTelegram } from "../telegram/useTelegram.ts";
import { resolveInitData } from "./resolveInitData.ts";
import { demoLogin, getMe, telegramLogin } from "./authClient.ts";

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
        // Demo mode: ?demo=1 in the URL triggers a preview-only demo
        // login that bypasses Telegram auth entirely, so the app can be
        // shown to people outside Telegram for design review / feedback.
        const isDemoMode =
          new URLSearchParams(window.location.search).get("demo") === "1";

        let login;
        if (isDemoMode) {
          login = await demoLogin();
        } else {
          const initData = await resolveInitData(
            webApp,
            isMock,
            import.meta.env.DEV,
          );

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

          login = await telegramLogin(initData);
        }
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
