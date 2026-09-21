/** Generates a stable, prefixed application ID, e.g. `usr_3f9c2a1b...`. */
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
