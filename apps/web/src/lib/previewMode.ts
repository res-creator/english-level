/**
 * Whether this build is the preview deployment, and may therefore show
 * preview-only testing tools.
 *
 * It reads Vite's build mode, which is `"preview"` only for
 * `vite build --mode preview`. A production build evaluates this to
 * `false` at compile time, so the tools are tree-shaken out of the bundle
 * entirely — and the server refuses them anyway (see the API's
 * `isPreviewEnvironment`). Two independent guards, both failing closed.
 */
export const IS_PREVIEW_BUILD: boolean = import.meta.env.MODE === "preview";
