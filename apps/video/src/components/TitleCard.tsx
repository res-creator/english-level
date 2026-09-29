import React from "react";
import { interpolate } from "remotion";

interface TitleCardProps {
  text: string;
  localFrame: number;
  durationInFrames: number;
  fontSize?: number;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  text,
  localFrame,
  durationInFrames,
  fontSize = 52,
}) => {
  const opacity = interpolate(
    localFrame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: "16%",
        top: "16%",
        width: "68%",
        opacity,
        background: "rgba(0,0,0,0.42)",
        borderRadius: 24,
        padding: "28px 40px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "Poppins, Arial, sans-serif",
          fontWeight: 800,
          fontSize,
          color: "#FFFFFF",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {text}
      </p>
    </div>
  );
};
