import { useContext } from "react";
import { TelegramContext } from "./TelegramProvider";

export function useTelegram() {
  const ctx = useContext(TelegramContext);
  if (!ctx) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return ctx;
}
