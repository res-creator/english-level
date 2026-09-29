import { Composition } from "remotion";
import { EnglishLevelSegment } from "./compositions/EnglishLevelSegment";
import { askingForDirections } from "./data/segments/askingForDirections";
import { RigTest } from "./compositions/RigTest";
import { DialoguePoseDemo, DIALOGUE_POSE_DEMO_DURATION_SECONDS } from "./compositions/DialoguePoseDemo";

const AskingForDirectionsComp = () => <EnglishLevelSegment segment={askingForDirections} />;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AskingForDirections"
        component={AskingForDirectionsComp}
        durationInFrames={Math.round(
          askingForDirections.durationInSeconds * askingForDirections.fps,
        )}
        fps={askingForDirections.fps}
        width={1920}
        height={1080}
      />
      {/* Rig proof-of-concept -- isolated from the segment above on purpose. */}
      <Composition
        id="RigTest"
        component={RigTest}
        durationInFrames={30 * 12}
        fps={30}
        width={1920}
        height={1080}
      />
      {/*
        Pose-based dialogue proof-of-concept -- deliberately NOT built on
        the skeletal RigTest mechanic. See
        .claude/skills/speak-english-character-animation/.
      */}
      <Composition
        id="DialoguePoseDemo"
        component={DialoguePoseDemo}
        durationInFrames={Math.round(DIALOGUE_POSE_DEMO_DURATION_SECONDS * 30)}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
