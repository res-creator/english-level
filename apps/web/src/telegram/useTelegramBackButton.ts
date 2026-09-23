import { useEffect } from "react";
import { useTelegram } from "./useTelegram.ts";

/**
 * Shows Telegram's native BackButton for the lifetime of the calling
 * screen, wired to the same handler as the in-app back control, so the
 * two never disagree. Passing nothing leaves the native button hidden —
 * a screen with no "back" must not show one that does nothing. A no-op
 * outside Telegram / on older clients.
 */
export function useTelegramBackButton(onBack?: () => void) {
  const { webApp } = useTelegram();

  useEffect(() => {
    const backButton = webApp.BackButton;
    if (!backButton || !onBack) return;
    backButton.show();
    backButton.onClick(onBack);
    return () => {
      backButton.offClick(onBack);
      backButton.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webApp, !onBack]);
}
