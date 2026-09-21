import type { UserRow } from "../db/types.ts";
import type { Env } from "../env.ts";

/** Shared Hono generics: bindings + the `currentUser` set by `requireAuth`. */
export interface AppEnv {
  Bindings: Env;
  Variables: {
    currentUser: UserRow;
  };
}
