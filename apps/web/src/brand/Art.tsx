import type { CSSProperties, ReactNode } from "react";
import { resolveArt } from "./artRegistry.ts";

/**
 * One illustration slot.
 *
 * If real art exists for this name it renders an `<img>`; if not it
 * renders the coded placeholder passed as `fallback`. Either way the box
 * it occupies is identical, so layout never shifts when artwork lands.
 *
 * The image is always decorative from the screen reader's point of view
 * unless it is given an `alt` — the meaning of every screen lives in its
 * text, never in the picture.
 */
interface Props {
  name: string;
  /** Left empty for decoration; set only when the picture carries meaning. */
  alt?: string;
  fit?: CSSProperties["objectFit"];
  position?: CSSProperties["objectPosition"];
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  /** Above-the-fold art loads eagerly; everything else waits. */
  priority?: boolean;
  fallback?: ReactNode;
}

export function Art({
  name,
  alt = "",
  fit = "contain",
  position = "center",
  className,
  style,
  width,
  height,
  priority = false,
  fallback = null,
}: Props) {
  const art = resolveArt(name);
  if (!art) return <>{fallback}</>;

  return (
    <img
      className={className}
      src={art.src}
      srcSet={art.srcSet}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      style={{ objectFit: fit, objectPosition: position, ...style }}
    />
  );
}

/**
 * A full-bleed layer inside a positioned parent — backdrops, foregrounds,
 * room environments. Renders nothing at all when its art is missing, so a
 * scene degrades to its background colour rather than to a broken box.
 */
export function ArtLayer({
  name,
  className,
  position = "center bottom",
  fit = "cover",
  priority = false,
  fallback = null,
}: Pick<
  Props,
  "name" | "className" | "position" | "fit" | "priority" | "fallback"
>) {
  return (
    <Art
      name={name}
      className={["art-layer", className].filter(Boolean).join(" ")}
      fit={fit}
      position={position}
      priority={priority}
      fallback={fallback}
    />
  );
}
