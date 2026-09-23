import { useNavigate } from "react-router-dom";
import { useTelegramBackButton } from "../telegram/useTelegramBackButton.ts";
import { IconButton } from "./Button.tsx";

/**
 * In-screen header for sub-screens. Also wires Telegram's own BackButton
 * to the same handler, so the native chrome and the in-app control never
 * disagree about where "back" goes.
 */
export function TopBar({
  title,
  onBack,
  trailing,
}: {
  title?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  useTelegramBackButton(handleBack);

  return (
    <div className="topbar">
      <IconButton label="Назад" onClick={handleBack}>
        ←
      </IconButton>
      {title ? (
        <span className="topbar__title grow">{title}</span>
      ) : (
        <span className="grow" />
      )}
      {trailing}
    </div>
  );
}
