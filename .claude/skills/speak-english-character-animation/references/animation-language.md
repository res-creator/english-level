# Speak in English — animation language (operational rules)

Distilled from `reference-video-analysis.md`. Read that file if you want
the evidence; this file is the rule set to actually apply. It's written
against what `apps/video/` already implements (see file pointers below)
so defaults aren't invented — they're either "this is what's already
shipped, keep doing it" or "this is what the references show but we
haven't built yet."

## The one-sentence version

**Poses and faces carry the performance; the body mostly holds still;
the camera punctuates rather than drifts.** Every reference video proves
this. The single biggest way to make a Speak in English scene look worse
than the references is to add continuous motion everywhere out of a
feeling that "animation" means "always moving."

## 1. Character movement

### Idle behavior (between pose changes, while a character is just present)
- Blink only. No breathing loop, no bounce, no constant sway, unless the
  character has been silent and off-focus for several seconds, in which
  case at most a barely-perceptible sway is acceptable (see body sway
  below) — the references show almost none of this, so default to none.
- `RigCharacter.tsx` already does blink correctly: ~3.4s period, 5-frame
  duration. Reuse that cadence for any new character.

### Head movement
- Small tilts/turns (±2-3°) timed to emphasis words or line changes —
  not a constant metronomic wobble running underneath everything.
- Current default (`headAngle = sin(t*1.1)*2.5`, `headBobPx = sin(t*1.6)*3`)
  is an *always-on* approximation and is the one place our current rig
  is more animated than the references warrant. Acceptable for a
  continuously-talking host shot; if a character has a silent moment,
  ease this toward zero rather than leaving it running.

### Blinking
- Every ~3-4s, 4-6 frames, both eyes together. Never blink during a hard
  emotional pose swap (it reads as a glitch, not a natural blink).

### Listening reactions (critical — see §5, "Reactions")
A character who is on screen but not currently speaking must not freeze,
but the fix is *one small timed beat*, not continuous idle motion.

### Speaking reactions
- Mouth state driven by the voiceover (see §2).
- One small head tilt or brow raise on the line's stressed word is
  enough; don't add gesture on every single line.

### Pose swaps
- The primary tool for "this character is doing something now." A pose
  swap is a full-character (or full-limb-chain) change between two
  authored states — arms crossed → one hand raised, neutral stance →
  leaning forward, etc.
- Reserve pose swaps for: a scene cut, a new speaker taking the floor, a
  gesture tied to a specific word ("here," "this," pointing at a level
  badge), or an emotional/emphasis beat.
- Never swap pose on every line — the references change body pose far
  less often than they change mouth/eye state.

### Arm gestures
- Prefer a discrete pose swap (two authored arm positions, transition
  between them per §7) over continuous joint animation. This matches
  the references (a raised hand is a *held* pose, not a constantly
  moving limb) and is also why pose-swap outranks skeletal rig by
  default (§6).
- If using the rig's joint-based gesture (as `RigTest` currently does),
  keep it to one arm, one clear up-down-settle arc, not a looping motion.

### Body sway
- Tiny amplitude, different frequency/phase than head motion, no
  vertical component (a vertical bob reads as floating). `RigCharacter.tsx`
  implements this already (`bodySwayDeg = sin(t*0.35+0.6)*0.8`,
  `bodySwayXPx = sin(t*0.27)*2`) — treat those numbers as the ceiling,
  not a floor. The references show close to zero body sway; don't push
  this higher when styling a new character.

### Seated behavior
- Not yet built. If a scene needs a seated character, author it as a
  distinct pose (not a standing rig awkwardly bent) — the references'
  seated shots (IMG_7727 frame 0) show a fully re-drawn seated pose, not
  a standing character rotated at the hips.

### Walking / entrance / exit
- Do **not** attempt a multi-frame gait cycle — the references don't
  either (see reference-video-analysis.md §4-5). Approximate with 1-2
  held "passing" stances plus a position/scale move (character slides or
  scales in), or simply cut to the new pose already in frame.

### Emotion changes
- A genuine emotional beat (surprise, frustration, excitement) gets a
  **full pose swap**, not just a face-state change — raised eyebrows
  alone under-sells it. Pair the face state with a body pose change for
  anything stronger than mild reaction.

## 2. Lip-sync

Already implemented in `apps/video/src/lib/lipSync.ts` — read it before
reinventing this for a new character. Rules, generalized:

- **Never decide mouth state from a single frame's amplitude.** Speech
  amplitude is noisy; a raw per-frame threshold flickers. Always smooth
  first (moving average over a few frames) and only change state after
  it's held for a minimum number of frames.
- **Hysteresis, not one threshold.** The amplitude that closes the mouth
  should be lower than the amplitude that opened it, so a value sitting
  right at the boundary doesn't chatter. Current defaults: enter mid at
  0.14, leave mid at 0.08; enter open at 0.55, leave open at 0.40 (all on
  the post-gain 0-1 scale — see the `AMPLITUDE_GAIN = 3.2` note in the
  code, needed because raw `visualizeAudio` bins run much lower than 0-1
  for normal speech).
- **Minimum hold time**: 4 frames (~130ms at 30fps) before a state is
  allowed to change again, on top of the smoothing.
- **This must be a pure function of the whole audio track, computed
  once** (e.g. via `useMemo`), not sequential per-frame React state.
  Remotion renders frames across parallel workers with no guaranteed
  order, so "remember what the previous rendered frame did" is unsound —
  it'll produce different results in preview vs. a parallelized render.
  `computeMouthStates()` in `lipSync.ts` is the reference implementation;
  copy the *pattern*, not just the numbers, for any new mouth-driving
  logic.
- **When to use a pose swap instead of mouth-only animation**: if the
  line calls for a strong reaction (shouting, gasping) rather than
  ordinary talking, swap the whole face/pose rather than relying on the
  open mouth-state alone to carry it — see §1 "Emotion changes."
- **Avoiding flicker in general**: the three failure modes are (a) no
  smoothing, (b) a single threshold instead of hysteresis, (c) no
  minimum hold. Fix all three, not just one — they compound.

## 3. Camera

The references use camera motion as **punctuation**, not a constant. See
`apps/video/src/lib/camera.ts` (`cameraStateAt`) for the current
implementation pattern.

- **Push-in**: use once, at a scene's establishment — wide shot easing to
  a closer framing on the speaker, then hold. This is IMG_7727's opening
  beat. Don't repeat it every few seconds inside an otherwise-continuous
  shot unless you have real beat boundaries to justify each push (see
  below).
- **Reframing**: when the active speaker changes in a two-character
  scene, a *very* mild reframe/weight shift toward the new speaker is
  acceptable — but IMG_7728 (a full two-shot dialogue) shows this can
  also be zero: the camera stayed static for the entire exchange and the
  scene still read as lively because the characters carried it.
- **How strong**: subtle. Current default `PUSH_IN_MAX_SCALE = 1.025`,
  `PUSH_IN_MAX_LIFT_PX = 8` (on a 1080-tall frame) — a scale change you'd
  have to look for, not a zoom you'd notice as "the camera is zooming."
  Ease in/out (never linear, never a hard cut in zoom level).
- **When to stay static**: the default. Only add camera motion when it's
  tied to a real story beat (new scene, new speaker, emphasis line) —
  never as ambient "keep it visually interesting" filler. A static
  camera with good character performance (per §1) is what the references
  actually do most of the time.
- **Active speaker gets more visual weight**: in a two-shot, this can be
  as simple as the very small reframe above, or — cheaper and just as
  effective per the references — the listener simply holding still while
  only the speaker's face/gesture animates, which naturally draws the
  eye.
- **RigTest's current push-in runs on a fixed timer** because it's a
  single continuous line with no beat data. That's an acknowledged
  simulation, not the target end state — a real multi-speaker segment
  should drive this from `SegmentConfig.beats[]` (or equivalent speaker-
  turn data), not a clock.

## 4. Pacing

- **Animation events per 1-2 seconds**: roughly one. A blink, a mouth
  state change, a small head tilt — not three things changing at once
  outside of a deliberate emphasis beat (where a pose swap + face change
  + maybe a camera nudge can coincide on purpose).
- **How often to change pose**: tied to content (cuts, new speaker,
  emphasis, emotion), not a timer. If nothing narratively justifies a
  pose change, don't add one — see reference-video-analysis.md, every
  clip holds body pose steady for many seconds at a time.
- **Avoiding constant motion**: the test is "if I freeze this frame at a
  random point, does it look like a natural held pose, or like I caught
  it mid-fidget?" References pass this test almost everywhere; that's
  the bar.
- **Natural-feeling pauses**: let a pose simply hold through a pause —
  don't fill silence with idle motion. A pause is not a gap that needs
  animating; it's a beat.

## 5. Reactions (the listening character)

A non-speaking character on screen must read as present and listening,
not frozen — but the references solve this with **one small, well-timed
beat**, not continuous fidgeting. Pick exactly one per listening turn,
timed to the speaker's key word:
- a small nod (a few degrees, held, settle back)
- a blink (if the normal blink cycle happens to land there, that alone
  can be enough — don't force an extra one)
- an eyebrow reaction (raise or furrow, timed to the line's punchline or
  key phrase)
- a slight head tilt
- a micro-expression (mouth corner shift toward a smile/frown)
- a brief pose shift (e.g., weight shift, hand moves slightly) — reserve
  this for a stronger reaction, it's the "loudest" option on this list

Do not combine more than one of these per listening turn unless the line
is a genuine big reaction moment (then treat it as an emotion change,
§1, and consider a full pose swap instead).

## 6. Pose-based animation vs. skeletal rig

**Default to pose-based, not skeletal rig.** Priority order when building
a new character or scene:

1. A set of well-drawn, complete character poses (the "photo library"
   approach — each pose is a finished piece of art, not a procedural
   pieced-together rig)
2. Facial states (eyes/brows layered onto whichever pose is active)
3. Mouth states (per §2)
4. Light transforms on top of a pose (small translate/rotate/scale — the
   body-sway/head-sway kind of thing, kept tiny per §1)
5. Camera movement (per §3)

Only reach for the full hierarchical joint rig (what `RigCharacter.tsx`
/ `brunetteBust.ts` build) when a specific asset has actually been
rigged well for it — good pivots, proper overlap at every joint, a
genuine need for continuous per-joint motion (like the gesture demo it
was built to prove out). Don't rig a character "by default" just because
the tooling exists; the references themselves rarely need more than
pose-swap + face-swap to look alive, and a badly-pivoted rig looks worse
than a clean pose swap.

## 7. Visual quality — anti-patterns (never do these)

- **Rubber-stretching a PNG.** Scaling a static image to imply motion
  (e.g., squishing a mouth region to fake talking) reads as cheap the
  moment you look for it. `RigCharacter.tsx` has a jaw-flap fallback for
  when no `mouthVariants` art exists yet — that's a documented,
  temporary placeholder, never the target quality bar.
- **Cheap jaw-flap as the final mouth solution.** Real mouth-state art
  (closed/mid/open, or a fuller viseme set) is the bar; a procedural
  squish is a stand-in until that art exists, not a style choice.
- **Overdone breathing effect.** A visible, continuous chest-rise
  breathing loop reads as an animation-school exercise, not a character
  performance. If used at all, it should be nearly imperceptible.
- **Constant bounce.** Any idle animation with a spring/bounce easing
  repeating on a loop signals "generic motion graphics," which is
  exactly what the project regulation (§3) says to avoid.
- **Excessive zoom.** See §3 — the references barely zoom at all.
- **Tiny character in a huge empty frame.** A whole earlier round of
  this project's own work hit this bug (a CSS aspect-ratio miscalculation
  squashed the character to a fraction of the frame) — always verify the
  character's actual visible-content bounding box lands in a sensible
  fraction of the frame (roughly 45-55% of frame height for a bust shot),
  not just that some box is sized "about right."
- **Abrupt pose swaps with no transition.** See §7 below for what to add
  instead.
- **Random movement for its own sake.** Every motion should trace back
  to a reason (line content, emphasis, reaction, cut) — if you can't
  name the reason, cut the motion.

## 8. Transitions between poses

Never hard-cut between two authored poses in the middle of a continuous
shot (a hard cut is fine *at* a scene cut). Use, in rough order of
weight:

- **2-4 frame blend / crossfade**: the default for a same-character pose
  swap within a shot. Cheap, effective, invisible if done right.
- **Slight position offset**: pair the blend with a small
  translate (a few px) so the swap doesn't read as a static "photo
  change" — motion sells the transition as much as the crossfade does.
- **Anticipation**: for a bigger gesture (the emphasis-beat pose swaps
  in §1), a tiny counter-motion just before the swap (a small dip/lean
  the "wrong" way) reads as more intentional than snapping straight to
  the new pose.
- **Settle**: after a pose swap lands, a brief ease-out (slight
  overshoot-and-settle, or just a soft deceleration) instead of stopping
  dead. This is what separates "the character moved" from "the character
  teleported."
- **Crossfade** (full scene/shot level, not pose-to-pose) is for cuts
  between backgrounds/locations, not for swapping a character's pose
  within one continuous shot.

## 9. Scene grammar (dialogue scenes)

Default flow for a two-character teaching scene:

```
establishing shot → speaker A → reaction (B) → speaker B → reaction (A)
  → emphasis / teaching moment → resolution
```

- **Establishing**: per §3, a brief wide-to-push-in beat (or simply open
  already on the two-shot if the scene doesn't need geographic context).
- **Speaker A / B**: mouth-state animation (§2) + at most one small
  gesture or head-tilt tied to the line's key word (§1).
- **Reaction (B) / (A)**: exactly one small beat from §5, timed to the
  other character's key word — never a frozen listener.
- **Emphasis / teaching moment**: this is where the video's actual
  teaching content lives (the target phrase, the level badge, the
  contrast being taught) — this is the one place a slightly stronger
  beat (pose swap, small camera reframe, text/overlay emphasis) is
  justified, because it's carrying the lesson, not just decoration.
- **Resolution**: settle back to a calm held pose; don't end on a mid-
  gesture frame.

## 10. Educational priority

Animation exists to serve the teaching content, never the other way
around. When anything conflicts, resolve in this order:

```
voice (the audio, always intelligible and dominant)
  → target phrase (the English being taught must be the clearest thing on screen)
  → character expression (sells the meaning/tone of the phrase)
  → motion (supports the above, per every rule in this file)
  → decoration (background detail, secondary props — lowest priority, first to simplify/cut)
```

Concretely: never let a camera push, a pose swap, or a transition
obscure or compete with the on-screen target phrase or the level badge
that's the actual lesson. If a scene feels "too busy," cut decoration
and secondary motion before touching the phrase/caption layer.
