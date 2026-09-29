import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CEFRLevel, SegmentConfig } from "../data/types";
import { characters } from "../data/characters";
import { Background } from "../components/Background";
import { Character } from "../components/Character";
import { SpeechBubble } from "../components/SpeechBubble";
import { LevelBadge } from "../components/LevelBadge";
import { ObservationCaption } from "../components/ObservationCaption";
import { TitleCard } from "../components/TitleCard";

interface EnglishLevelSegmentProps {
  segment: SegmentConfig;
}

const sec = (fps: number, seconds: number) => Math.round(seconds * fps);

export const EnglishLevelSegment: React.FC<EnglishLevelSegmentProps> = ({ segment }) => {
  const { fps } = segment;
  const host = characters[segment.hostCharacter];
  const guest = characters[segment.guestCharacter];
  const guestFromFrame = sec(fps, segment.guestAppearsAtSeconds);

  return (
    <AbsoluteFill>
      <Background src={segment.background} />
      <Audio src={staticFile(segment.voiceover)} />

      {/* Host: on screen the whole segment, mouth driven by the voiceover throughout. */}
      <Character
        config={host}
        left={0.02}
        top={0.55}
        width={0.16}
        audioSrc={segment.voiceover}
        isTalking
      />

      {/* Guest: idle only (no separate voice track yet), appears once the situation starts. */}
      <Sequence from={guestFromFrame} name="guest-character">
        <Character
          config={guest}
          left={0.82}
          top={0.55}
          width={0.16}
          audioSrc={segment.voiceover}
          isTalking={false}
        />
      </Sequence>

      <Sequence
        from={sec(fps, segment.intro.startSeconds)}
        durationInFrames={sec(fps, segment.intro.durationSeconds)}
        name="intro-title"
      >
        <TitleCard
          text={segment.intro.text}
          localFrame={0}
          durationInFrames={sec(fps, segment.intro.durationSeconds)}
        />
      </Sequence>

      <Sequence
        from={sec(fps, segment.situationLabel.startSeconds)}
        durationInFrames={sec(fps, segment.situationLabel.durationSeconds)}
        name="situation-label"
      >
        <TitleCard
          text={segment.situationLabel.text}
          localFrame={0}
          durationInFrames={sec(fps, segment.situationLabel.durationSeconds)}
          fontSize={36}
        />
      </Sequence>

      {segment.beats.map((beat, i) => (
        <React.Fragment key={beat.level}>
          <Sequence
            from={sec(fps, beat.badgeStartSeconds)}
            durationInFrames={sec(fps, beat.badgeDurationSeconds)}
            name={`${beat.level}-badge`}
          >
            <LevelBadgeAtFrame level={beat.level} />
          </Sequence>

          <Sequence
            from={sec(fps, beat.quoteStartSeconds)}
            durationInFrames={sec(fps, beat.quoteDurationSeconds)}
            name={`${beat.level}-quote`}
          >
            <SpeechBubbleAtFrame text={beat.quote} />
          </Sequence>

          <Sequence
            from={sec(fps, beat.observationStartSeconds)}
            durationInFrames={sec(fps, beat.observationDurationSeconds)}
            name={`${beat.level}-observation`}
          >
            <ObservationCaptionAtFrame
              text={beat.observation}
              durationInFrames={sec(fps, beat.observationDurationSeconds)}
            />
          </Sequence>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

// Small wrappers so each piece can read its own local frame via useCurrentFrame()
// while staying declared inline above for readability of the timeline.
const LevelBadgeAtFrame: React.FC<{ level: CEFRLevel }> = ({ level }) => {
  const frame = useCurrentFrame();
  return <LevelBadge level={level} localFrame={frame} />;
};

const SpeechBubbleAtFrame: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return <SpeechBubble text={text} localFrame={frame} />;
};

const ObservationCaptionAtFrame: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  return (
    <ObservationCaption text={text} localFrame={frame} durationInFrames={durationInFrames} />
  );
};
