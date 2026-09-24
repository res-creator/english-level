import { Component, type ReactNode } from "react";
import { ErrorState } from "./ui/states.tsx";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * The one safety net around the whole app. Without it, an uncaught
 * render error anywhere in the tree — a malformed API response, an
 * unexpected null a screen didn't guard against — unmounts React
 * entirely and leaves a genuinely blank white screen, with no way back
 * except force-quitting Telegram. A full reload is the only recovery
 * React itself allows after a render crash, so that's what the retry
 * does; there's nothing more targeted to offer once the tree is gone.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="center-screen">
          <ErrorState
            title="Что-то сломалось"
            message="Попробуй открыть приложение заново."
            onRetry={() => window.location.replace("/")}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
