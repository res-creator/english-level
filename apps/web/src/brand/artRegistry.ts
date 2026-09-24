/**
 * The illustration slot system.
 *
 * Every picture in the product is addressed by a stable name, never by a
 * path. An illustrator drops `kvo-full-idle.png` into `src/brand/art/`,
 * the build picks it up, and that slot stops rendering its coded
 * placeholder — no component changes, no route changes, no rebuild of the
 * UX around it.
 *
 * Nothing here draws anything. Text, buttons, bubbles and every piece of
 * state stay real DOM above the artwork, so a picture can be swapped, or
 * missing entirely, without the screen losing a single interaction.
 */

/** Everything Vite finds in the art folder, keyed by "./art/<file>". */
const FILES = import.meta.glob("./art/*.{png,webp,avif,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Smallest first is wrong for quality, so prefer modern formats. */
const EXTENSION_ORDER = ["avif", "webp", "png", "jpg", "jpeg"];

function findFile(basename: string): string | null {
  for (const extension of EXTENSION_ORDER) {
    const url = FILES[`./art/${basename}.${extension}`];
    if (url) return url;
  }
  return null;
}

export interface ResolvedArt {
  src: string;
  /** Density descriptors, so a @2x/@3x drop-in is used automatically. */
  srcSet?: string;
}

/**
 * Resolves a slot to whatever art exists for it.
 *
 * `name.png` is the 1x file; `name@2x.png` and `name@3x.png` are picked up
 * automatically when present. Shipping a single high-resolution file also
 * works — CSS sizes the box, so a 3x-sized asset simply renders sharp.
 */
export function resolveArt(name: string): ResolvedArt | null {
  const base = findFile(name);
  if (!base) return null;

  const densities: string[] = [`${base} 1x`];
  const at2x = findFile(`${name}@2x`);
  const at3x = findFile(`${name}@3x`);
  if (at2x) densities.push(`${at2x} 2x`);
  if (at3x) densities.push(`${at3x} 3x`);

  return {
    src: base,
    srcSet: densities.length > 1 ? densities.join(", ") : undefined,
  };
}

export function hasArt(name: string): boolean {
  return findFile(name) !== null;
}

export { artName } from "./artNames.ts";

/**
 * Warms the browser cache for a whole situation before it starts.
 *
 * A face that changes expression mid-conversation must not flicker while
 * the next file downloads — that single frame is enough to break the
 * illusion of one continuous scene.
 */
export function preloadArt(names: string[]): void {
  if (typeof Image === "undefined") return;
  for (const name of names) {
    const art = resolveArt(name);
    if (!art) continue;
    const image = new Image();
    if (art.srcSet) image.srcset = art.srcSet;
    image.src = art.src;
  }
}
