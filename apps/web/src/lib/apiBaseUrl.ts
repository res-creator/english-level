// `import.meta.env` itself (not just the variable on it) is only ever
// injected by Vite — reading straight through it would throw under plain
// `node --test`, which is how the client's own logic (not just its UI)
// gets unit tested. The `?? {}` is what makes that possible.
export const API_BASE_URL: string =
  (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:8787";
