import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import { capturePendingInviteFromUrl } from "./lib/pendingInvite.ts";
import "./styles.css";

// Before any routing runs — RootRedirect's first <Navigate> would
// otherwise drop a shared invite link's ?invite= query param.
capturePendingInviteFromUrl();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
