import React from "react";
import { spring, useVideoConfig } from "remotion";
import { CEFRLevel } from "../data/types";
import { levelColor } from "../lib/levelColors";

interface LevelBadgeProps {
  level: CEFRLevel;
  /** Frame, relative to this badge's own entrance, used to pop it in. */
  localFrame: number;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, localFrame }) => {
  const { fps } = useVideoConfig();
  const scale = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 180 } });

  return (
    <div
      style={{
        position: "absolute",
        left: "42%",
        top: "4%",
        width: "16%",
        padding: "0.6% 0",
        borderRadius: 999,
        background: levelColor(level),
        color: "#FFFFFF",
        fontFamily: "Poppins, Arial, sans-serif",
        fontWeight: 800,
        fontSize: 30,
        textAlign: "center",
        transform: `scale(${scale})`,
        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
      }}
    >
      {level}
    </div>
  );
};
