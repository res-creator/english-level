# Reference video analysis (source for the animation language)

Five vertical (9:16, ~24fps) TikTok clips, two studios: `@robson_espinosa`
(solo monologue-to-camera format) and `@rightside_studio` (family/street
dialogue format, and solo comedic-beat format). Frame-sampled at ~8 evenly
spaced points per clip plus tighter sampling around scene starts. This
file is the evidence base; `animation-language.md` is the distilled,
reusable rule set built from it. Nobody using the skill needs to re-derive
these observations, but they're kept here for traceability and for
re-analyzing future reference videos the same way.

## Per-video findings

### 1. IMG_7727 (@robson_espinosa, ~60s) — solo phone-call monologue, multi-location

- **Type**: flat-vector cutout/puppet rig (Gravity-Falls-adjacent style),
  not frame-by-frame. Evidence: identical proportions and line quality
  held across every pose; changes are discrete pose swaps, not organic
  per-frame redraws.
- **Pose-based vs. continuous**: strongly pose-based. Whole-body pose
  changes almost only at scene cuts (new room = new held pose). *Within*
  a held shot, only the face (eyes/brows/mouth) animates continuously.
- **Head movement**: small tilts/turns timed to emphasis words, not a
  constant idle wobble.
- **Body**: settles into one pose per shot and holds it; the arm holding
  the phone doesn't drift.
- **Lip-sync**: discrete, clearly distinct mouth shapes per syllable
  group — closed vs. wide-open are unambiguous, not a gradient.
- **Camera**: the opening ~2-3s pushes in from a wide establishing shot
  (full room, furniture, framed art all visible) to a closer chest-up
  framing, then holds. Confirms "establish, then push to speaker."
- **Cuts**: roughly every 8-20s (long-form comedic monologue) — not
  rapid-fire.
- **Captions**: burned in, one short line at a time, tight to speech.

### 2. IMG_7728 (@rightside_studio, 11.4s) — mother/son kitchen dialogue

- **Type**: cutout/puppet, two-shot (both characters on screen together).
- **Listener behavior**: the mother (listening) holds her base pose (hand
  on hip) but her eyebrow/mouth visibly shift once, timed to the son's
  key line ("CARAMBA, FILHO") — a single reaction beat, not continuous
  motion, not a frozen face either.
- **Camera**: static across the whole clip. No push/pan detected. The
  scene's "life" comes entirely from face + the speaker's hand gesture
  (holding out money), not camera motion.
- **Speaker**: one clear pose swap (raising the hand with the bill) tied
  to the emphasis word.

### 3. IMG_7729 (@robson_espinosa, 13.2s) — two-character street exchange

- **Type**: cutout/puppet, static wide two-shot.
- Both characters hold full-body stance for the whole sampled range (one
  arms-crossed, one neutral) — body carries almost no motion.
- Facial expression (confused/questioning brow vs. neutral) plus captions
  carry the entire beat. Reinforces: **when in doubt, animate the face,
  not the body.**

### 4. IMG_7730 (@rightside_studio, 13.5s) — solo character, room-to-room

- Bald character shown in a settled contrapposto stance (weight on one
  leg, hand on hip) rather than mid-walk-cycle — "walking" in this style
  reads as a held confident stance + a location cut, not a multi-frame
  gait.
- Same character design held identically across a location change —
  confirms character consistency is non-negotiable even across cuts.

### 5. IMG_7731 (@rightside_studio, 45.9s) — solo character, outdoor walk + angry beat

- Early frames: relaxed outdoor walking pose (again, a held stance +
  camera/position movement, not a joint-by-joint gait cycle).
- Later frames: a full **pose swap** for the emotional peak — raised
  fist, furrowed brow, wide shouting mouth. This is a whole-body change,
  not just a facial-state change.
- Confirms an important nuance: strong emotional/comedic beats get a
  **full pose swap**, not just a face swap — facial state alone isn't
  enough to sell a big emotional moment.

## Cross-video patterns (what repeats everywhere)

1. Character design is completely consistent across every scene and cut
   within a video — never redesigned, never restyled mid-piece.
2. Whole-body pose changes are **discrete and infrequent** — triggered
   by cuts or by a genuine emphasis/emotional beat, never by idle ambient
   motion. Between those moments, only the face (and occasionally one
   hand/arm) animates.
3. The face does almost all of the "this character is alive" work:
   blink, brow, mouth shape read far stronger than any body motion.
4. Camera motion is a **punctuation mark**, not a constant. It pushes in
   once at a scene's establishment (solo monologue format) or stays
   fully static for an entire two-shot dialogue exchange. It's never
   continuously drifting.
5. A listening character never fully freezes, but the "not frozen" signal
   is *one* small, well-timed reaction (brow/mouth), not continuous
   fidgeting.
6. Big emotional/comedic peaks get a full-body pose swap, not just a
   face change.
7. Captions are burned in, short, one line at a time, tightly synced.
8. There is no visible idle "breathing" loop or bounce on a held pose —
   poses are genuinely static between changes. Motion always has a
   *reason* (a gesture, a reaction, a cut, an emphasis beat).

## Remotion feasibility triage

**Reproduces well with our current approach (pose/state-swap, not a
skeletal rig):**
- Face/eye/brow/mouth state swaps — this is what we already do.
- Discrete whole-pose or whole-character-image swaps at cuts or emphasis
  beats.
- A single, brief listener reaction beat (brow/mouth swap timed to a cue).
- Camera push-in as a punctuation event at scene starts, or held static
  for a whole two-shot — not a constant background motion.
- Burned-in captions synced to speech.

**Only approximately reproducible — keep it restrained:**
- Body sway / weight shift: the references show almost none of it. Ours
  should stay tiny and rare, not an always-on ambient loop.
- Arm/hand gestures: reproduce as a discrete pose change (a held "before"
  and "after," not a continuously animated joint) — this is exactly why
  pose-swap should outrank skeletal-rig by default.
- Walking/entrance: approximate as 1-2 held stances (a "passing" pose)
  plus a position/scale move, not a real multi-frame gait cycle.

**Do not fake — needs real frame-by-frame/Toon Boom-quality work, or
should simply be avoided:**
- Genuine secondary motion (hair/cloth follow-through, overlapping
  action).
- Multi-joint IK walk cycles with real foot planting.
- The organic in-betweening/easing a professional rig's animator puts
  between poses — a coarse CSS transform between two static poses looks
  cheap if pushed too far (this is exactly the "rubber stretching" /
  "jaw-flap" anti-pattern the animation-language reference warns against).
