# SPEAK IN ENGLISH — VIDEO PRODUCTION REGULATION

This file is the working rulebook for Claude Code + Remotion in the user's English-learning video project.

## 0. Core principle

The goal is not generic AI video. The goal is a repeatable, consistent educational animation pipeline where Claude can:
- assemble scenes in Remotion;
- use the same recurring characters and visual language;
- sync captions and speech;
- animate characters with a lightweight 2D cut-out rig;
- render final social video with minimal manual editing.

Do not redesign the whole system when producing a new video. Reuse the existing project structure and components.

## 1. Technology stack

Primary stack:
- Claude Code
- Node.js / pnpm
- Remotion (React)
- ffmpeg
- Chromium / headless shell for rendering
- Whisper / Remotion transcription tooling for real word-level timestamps when captions are generated from audio

Existing Remotion project lives under `apps/video/`.
Do not create a second video project unless explicitly requested.

## 2. Recommended Remotion skills

Install / keep these skills as the main set:
- `remotion-best-practices`
- `remotion-create`
- `remotion-render`
- `remotion-captions`
- `remotion-multimedia`
- `remotion-docs`
- `remotion`

Useful when needed:
- `mediabunny` — media processing / conversion workflows
- `remotion-markup` — if annotation/markup scenes are needed
- `remotion-interactivity` — only for interactive Remotion use cases
- `remotion-maps` — only for map/location scenes
- `3d` — only when a specific scene truly needs 3D

Not part of the default workflow:
- `remotion-saas`
- `remotion-upgrade`

Do not add skills just because they exist. Prefer the smallest useful set.

## 3. Visual direction

The videos should feel:
- modern;
- calm;
- friendly;
- adult, not childish;
- visually readable on a phone;
- expressive but not hyperactive.

Avoid:
- generic SaaS motion graphics;
- excessive bounce/pop effects;
- random neon effects;
- over-animation;
- abrupt camera movement;
- changing character design from scene to scene.

Characters must remain visually consistent.

## 4. Character animation

Preferred approach: **limited 2D cut-out / puppet animation**.

For speaking scenes:
- head bob / small head rotation;
- blinking;
- mouth state switching;
- eyebrow reactions when assets exist;
- shoulder / elbow / wrist movement;
- occasional hand gestures;
- small body sway;
- subtle camera push-in or reframe between speakers.

Do not fake all character motion with scale-only or image stretching.

### Lip sync

Current simple lip-sync may use:
- `mouth_closed`
- `mouth_mid`
- `mouth_open`

Mapping:
- silence / very low amplitude → closed
- medium amplitude → mid
- high amplitude → open

Add smoothing / minimum hold time so the mouth does not flicker every frame.

Future improvement may add proper visemes such as:
- closed / M-B-P
- A
- E
- O
- wide/open

### Rig assets

When using the brunette bust rig, follow the exact existing rig specification and filenames. Do not alter pivots or canvas assumptions unless explicitly approved.

Rig code and art are separate:
- art should drop into existing filenames;
- do not rewrite rig logic just to compensate for a bad asset.

## 5. Reference videos

User-provided reference videos are guidance for:
- motion density;
- pacing;
- framing;
- character gesture frequency;
- camera movement;
- scene rhythm.

Do not copy specific characters, scenes, or compositions 1:1.
Extract the motion principles and adapt them to the existing project.

## 6. Captions

When captions must follow recorded speech, use **real transcription timestamps**, not guessed timing.

Recommended workflow:
1. Extract audio to 16 kHz mono WAV with ffmpeg.
2. Transcribe with Whisper / Remotion tooling with token-level timestamps.
3. Merge sub-tokens into real words.
4. Fix transcription text manually when needed, but preserve real ASR timing.
5. If a word boundary visibly drifts across a pause, verify against the waveform / silence detection rather than inventing timing.

Caption animation:
- simple fade in/out;
- avoid bounce/pop/scale on every caption change;
- one or two short lines maximum;
- keep captions clear of faces and key animation.

For English-learning videos, preserve punctuation when it helps meaning. Do not automatically remove commas unless the specific design calls for it.

## 7. Educational text hierarchy

Prefer:
1. situation / hook;
2. spoken English phrase;
3. short explanation or contrast;
4. optional translation only when the content format requires it.

Do not put long paragraphs on screen.

The spoken phrase should visually dominate when it is the teaching target.

## 8. Audio

- Voice must always dominate.
- Music, if used, stays clearly below speech.
- Prefer instrumental background music.
- Remove obvious noise / mouth clicks when practical.
- UI sound effects should be subtle.

Never let sound effects compete with language-learning audio.

## 9. Camera and composition

For dialogue:
- active speaker should receive slightly more visual emphasis;
- use mild reframing / push-in rather than hard cuts for every line;
- avoid making characters tiny in a large empty frame;
- speech bubbles should feel connected to the speaker;
- preserve safe margins for captions.

For vertical video:
- default social format may be 1080×1920;
- keep important faces, text and gestures away from UI-obscured top/bottom areas.

For existing 16:9 compositions, do not convert them automatically. Keep aspect ratio per composition unless the user asks.

## 10. Scene construction

Prefer data-driven scenes:
- dialogue text;
- speaker;
- timing;
- character state;
- camera state;
- caption state;
- background;
- educational overlay.

New situations should be created mainly by adding/changing data, not duplicating whole React components.

## 11. Rendering / QA

Before final render:
- typecheck;
- preview representative frames;
- verify no clipped text;
- verify safe areas;
- verify mouth/eyes do not jump;
- verify character does not change scale unexpectedly;
- verify audio sync;
- verify caption timing;
- verify first and last frames;
- verify no transparent gaps at rig joints during gestures.

Render quality:
- use a high-quality CRF target (around 16 when appropriate);
- do not duplicate compositions just for voice/no-voice variants — prefer props.

## 12. iPhone / HEVC sources

If an iPhone source does not decode in Chromium / Remotion, transcode it to H.264 before use with ffmpeg.

## 13. What not to inherit from external templates

Do NOT copy another creator's:
- brand palette;
- fonts;
- logo rules;
- CTA wording;
- product-specific branding;
- exact caption placement;
- exact social-media sales workflow.

External regulations are references for production discipline, not the project's brand identity.

## 14. Claude autonomy

Claude may autonomously:
- create/edit Remotion components;
- install approved Remotion skills;
- run typecheck;
- render previews;
- inspect representative screenshots;
- adjust timing, layout, camera movement and animation;
- use ffmpeg for media conversion;
- build caption timing from ASR.

Claude must stop and ask before:
- changing the overall visual identity;
- changing established character design;
- replacing the rig architecture;
- changing the approved content/script meaning;
- deploying/publishing externally;
- introducing a new paid external service.

## 15. Default workflow for a new video

1. Read this regulation.
2. Inspect existing `apps/video/` structure.
3. Reuse existing components/assets.
4. Read user script + references.
5. Build a short proof-of-concept segment first when introducing a new animation mechanic.
6. Render preview.
7. Inspect visually.
8. Fix only real issues.
9. Render final.
10. Keep the project reusable for the next video.
