import { Composition } from "remotion";
import { EnglishLevelSegment } from "./compositions/EnglishLevelSegment";
import { askingForDirections } from "./data/segments/askingForDirections";

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
    </>
  );
};
