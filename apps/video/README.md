# English Level — video pipeline (Remotion)

Programmatic assembly for the "How Would You Say This? A1–C2" YouTube series.
16:9, 1920×1080, 30fps.

## Run it

```bash
corepack pnpm install        # from the repo root, once
cd apps/video
pnpm dev                     # opens Remotion Studio (live preview + timeline)
pnpm render:directions       # renders out/asking-for-directions.mp4
```

Rendering needs a Chrome/Chromium headless binary. In this container the
official download host (`remotion.media`) is not on the network allowlist, so
render with the pre-installed one explicitly:

```bash
npx remotion render src/index.ts AskingForDirections out/asking-for-directions.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

On a machine where `remotion.media` is reachable, this flag isn't needed.

## Structure

```
src/
  Root.tsx                     registers the compositions
  compositions/
    EnglishLevelSegment.tsx    the reusable per-situation composition
  components/
    Background.tsx             Ken Burns pan/zoom on the 16:9 art
    Character.tsx               idle motion + blink + mouth animation
    SpeechBubble.tsx            dialogue-quote card
    LevelBadge.tsx               A1–C2 pill
    ObservationCaption.tsx      lower-third "what changed" caption
    TitleCard.tsx                intro / situation-label card
  data/
    types.ts                    shared types (SegmentConfig, CharacterConfig, ...)
    characters.ts                character registry (art path + face regions)
    segments/
      askingForDirections.ts    Situation 1 timeline, from the approved script
  lib/
    levelColors.ts               A1/A2 green, B1/B2 purple, C1/C2 terracotta
public/
  characters/<name>/full.jpg     one flat portrait per character (current art)
  backgrounds/<scene>.jpg        16:9 backgrounds
  audio/<segment>.mp3            voiceover track
```

To add a new situation: copy `data/segments/askingForDirections.ts`, adjust the
background/voiceover paths and the beat timings, then register a new
`<Composition>` in `Root.tsx` (or extend it to loop over a list of segments —
not done yet since you asked for one test segment first).

## Character animation — what's real right now vs. a placeholder

Every character gets, unconditionally:
- **Idle bob + sway** — a small sine-wave breathing motion. Free, no assets needed.
- **Blink** — a quick scaleY squash on the eye region every ~3.4s. Uses the
  existing single portrait (no new art needed), but the eye box is
  hand-calibrated per character (see `data/characters.ts` → `eyeRegion`).
  Host and blondeGuy are calibrated against the actual art; mustacheMan and
  purpleWoman have rough guesses marked `TODO` — recalibrate the same way
  before using them in Doctor / Store scenes (see "Calibration" below).

Mouth is the part that's a placeholder:
- **Right now**: a "jaw-flap" — the mouth region of the *same* portrait is
  masked out and stretched vertically, amount driven by the voiceover's
  live amplitude (`@remotion/media-utils`, `visualizeAudio`). It reads as
  "talking energy" but is not a real mouth shape — there's no distinct
  open/closed silhouette, just a stretch.
- **Once you provide mouth-shape art**: set `mouthVariants` on that
  character in `data/characters.ts` and `Character.tsx` automatically
  switches to swapping the *whole* portrait per frame instead of the flap
  hack — real (if simple, 3-viseme) lip-sync.

### Mouth-shape assets needed for real lip-sync

Per character, **3 whole-body PNGs**, same pose/background/everything as the
current portrait, differing *only* in the mouth:

| file | mouth state | used when |
|---|---|---|
| `mouth-closed.png` | closed / neutral | silence, low amplitude |
| `mouth-mid.png` | slightly open | medium amplitude |
| `mouth-open.png` | wide open | loud/peak amplitude |

Same canvas size as the current art (1493×2000), same crop/framing, so they
drop in as a straight swap. Put them at
`public/characters/<name>/mouth-{closed,mid,open}.png`, then in
`data/characters.ts`:

```ts
host: {
  ...
  mouthVariants: {
    closed: "characters/host/mouth-closed.png",
    mid: "characters/host/mouth-mid.png",
    open: "characters/host/mouth-open.png",
  },
},
```

Needed for the **2 characters actually on screen in Segment 1** (host,
blondeGuy) to upgrade this test; the other two only when their scenes
(Doctor / Restaurant / Store) get built.

### Calibration (eyeRegion / mouthRegion)

These are normalized (0–1) rectangles inside the portrait, used for the
blink and the current jaw-flap fallback. To (re)calibrate for new art:
crop candidate rectangles with Pillow, look at the crop, adjust the
fractions in `data/characters.ts` until eyes/mouth are tightly boxed. Not
needed once `mouthVariants` is used for a character (mouthRegion is only
consumed by the flap fallback) — but `eyeRegion` is still needed for blink
either way.

## Known gaps

- Only Segment 1 (Asking for Directions) is wired up. Doctor / Restaurant /
  Small Talk / Returning an Item still need `mustacheMan` / `purpleWoman`
  region calibration and their own segment data files.
- Single narrator voice reads both host lines and the "quoted" dialogue —
  the guest character (blondeGuy) is on-screen but idle (no separate voice
  track to lip-sync to). If/when per-character voice tracks exist, wire a
  second `audioSrc`/`isTalking` pair into the composition.
- No transitions between segments yet (each is a standalone composition);
  concatenation into the full ~9min video is a later step once all 5
  segments are approved individually.
