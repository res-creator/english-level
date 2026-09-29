import React from "react";
import { interpolate } from "remotion";

interface ObservationCaptionProps {
  text: string;
  localFrame: number;
  durationInFrames: number;
}

/** Lower-third educational caption, fading in/out at the edges of its window. */
export const ObservationCaption: React.FC<ObservationCaptionProps> = ({
  text,
  localFrame,
  durationInFrames,
}) => {
  const opacity = interpolate(
    localFrame,
    [0, 6, durationInFrames - 6, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: "12%",
        top: "83%",
        width: "76%",
        opacity,
        background: "rgba(0,0,0,0.38)",
        borderRadius: 16,
        padding: "14px 28px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "Poppins, Arial, sans-serif",
          fontWeight: 500,
          fontSize: 24,
          color: "#FDEDE3",
          textAlign: "center",
        }}
      >
        {text}
      </p>
    </div>
  );
};
