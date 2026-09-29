import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { CharacterConfig } from "../data/types";

interface CharacterProps {
  config: CharacterConfig;
  /** Position + size of the character's bounding box on the 16:9 canvas, normalized 0-1. */
  left: number;
  top: number;
  width: number;
  /**
   * The segment's voiceover track, used to drive the jaw-flap / mouth-shape swap.
   * Pass it to every character (hooks must run unconditionally) and gate the
   * actual animation with `isTalking`.
   */
  audioSrc: string;
  /** Only animate the mouth while this is true (e.g. only during this character's own lines). */
  isTalking?: boolean;
}

const BLINK_PERIOD_SECONDS = 3.4;
const BLINK_DURATION_FRAMES = 5;

export const Character: React.FC<CharacterProps> = ({
  config,
  left,
  top,
  width,
  audioSrc,
  isTalking = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const height = width / config.aspectRatio;

  // Idle motion: gentle breathing bob + a slower sway, out of phase so it doesn't look robotic.
  const bob = Math.sin((frame / fps) * 1.6) * 4;
  const sway = Math.sin((frame / fps) * 0.9 + 1) * 0.6;

  // Blink: a short scaleY squash on the eye region every ~3.4s.
  const cyclePos = (frame / fps) % BLINK_PERIOD_SECONDS;
  const blinkFrame = cyclePos < BLINK_DURATION_FRAMES / fps ? cyclePos * fps : -1;
  const blinkScale =
    blinkFrame >= 0
      ? interpolate(
          blinkFrame,
          [0, BLINK_DURATION_FRAMES / 2, BLINK_DURATION_FRAMES],
          [1, 0.08, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 1;

  // Mouth: real lip-sync once mouthVariants art exists; until then, a jaw-flap
  // stretch on the mouth region driven by the voiceover's amplitude.
  const audioData = useAudioData(staticFile(audioSrc));
  let openAmount = 0;
  if (isTalking && audioData) {
    const visualization = visualizeAudio({
      audioData,
      frame,
      fps,
      numberOfSamples: 16,
    });
    const amplitude = visualization.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    openAmount = Math.min(1, amplitude * 3.2);
  }

  let mouthSrc = staticFile(config.image);
  let useRegionFlap = true;
  if (config.mouthVariants) {
    useRegionFlap = false;
    if (!isTalking || openAmount < 0.12) mouthSrc = staticFile(config.mouthVariants.closed);
    else if (openAmount < 0.55) mouthSrc = staticFile(config.mouthVariants.mid);
    else mouthSrc = staticFile(config.mouthVariants.open);
  }

  const eyeStyle: React.CSSProperties = {
    position: "absolute",
    left: `${config.eyeRegion.x * 100}%`,
    top: `${config.eyeRegion.y * 100}%`,
    width: `${config.eyeRegion.width * 100}%`,
    height: `${config.eyeRegion.height * 100}%`,
    overflow: "hidden",
    transform: `scaleY(${blinkScale})`,
    transformOrigin: "center center",
  };

  const mouthRegionStyle: React.CSSProperties = {
    position: "absolute",
    left: `${config.mouthRegion.x * 100}%`,
    top: `${config.mouthRegion.y * 100}%`,
    width: `${config.mouthRegion.width * 100}%`,
    height: `${config.mouthRegion.height * 100}%`,
    overflow: "hidden",
    transform: `scaleY(${1 + openAmount * 0.9})`,
    transformOrigin: "top center",
  };

  const cutoutImgStyle = (region: CharacterConfig["eyeRegion"]): React.CSSProperties => ({
    position: "absolute",
    left: `${-region.x * (100 / region.width)}%`,
    top: `${-region.y * (100 / region.height)}%`,
    width: `${100 / region.width}%`,
    height: `${100 / region.height}%`,
    maxWidth: "none",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          width: `${width * 100}%`,
          height: `${height * 100}%`,
          transform: `translateY(${bob}px) rotate(${sway}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Img
            src={mouthSrc}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
          {/* Blink overlay: always a same-image cutout, invisible when scaleY is 1. */}
          <div style={eyeStyle}>
            <Img src={staticFile(config.image)} style={cutoutImgStyle(config.eyeRegion)} />
          </div>
          {/* Jaw-flap fallback overlay -- skipped once real mouthVariants art is wired in. */}
          {useRegionFlap && isTalking && (
            <div style={mouthRegionStyle}>
              <Img src={staticFile(config.image)} style={cutoutImgStyle(config.mouthRegion)} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
