import React from "react";
import { spring, useVideoConfig } from "remotion";

interface SpeechBubbleProps {
  text: string;
  localFrame: number;
  fontSize?: number;
}

/** The dialogue-quote card, upper-third of frame, with a small pointer nub. */
export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ text, localFrame, fontSize = 34 }) => {
  const { fps } = useVideoConfig();
  const progress = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 140 } });
  const opacity = Math.min(1, localFrame / 6);

  return (
    <div
      style={{
        position: "absolute",
        left: "16%",
        top: "16%",
        width: "68%",
        transform: `translateY(${(1 - progress) * -16}px)`,
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.95)",
          borderRadius: 28,
          padding: "22px 36px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          fontFamily: "Poppins, Arial, sans-serif",
          fontWeight: 700,
          fontSize,
          lineHeight: 1.3,
          color: "#2b2b2b",
          textAlign: "center",
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          marginLeft: 60,
          borderLeft: "16px solid transparent",
          borderRight: "16px solid transparent",
          borderTop: "18px solid rgba(255,255,255,0.95)",
        }}
      />
    </div>
  );
};
