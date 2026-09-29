---
name: speak-english-character-animation
description: Apply the Speak in English project's character-animation language (pose-based 2D cut-out performance, restrained camera, smoothed lip-sync, listener reactions, scene grammar) whenever building, editing, or reviewing a Remotion scene or composition for the Speak in English / English A1-C2 video series under apps/video/. Use this proactively for ANY work that touches character motion, poses, gestures, lip-sync, camera push-in/reframing, dialogue scene pacing, or a new RigTest-style proof-of-concept in this project — not just when the user says "animation" explicitly. Also consult it before adding idle motion, breathing effects, bounce, zoom, or any character-movement code to apps/video/, and before judging whether a rendered preview "looks right." Pairs with the remotion-best-practices/remotion-create/remotion-render/remotion-captions/remotion-multimedia/remotion-docs skills, which this one does not duplicate.
---

# Speak in English — character animation

This project's animation style is derived from five reference TikTok
clips (two Brazilian-Portuguese-language studios, `@robson_espinosa` and
`@rightside_studio`) — see `references/reference-video-analysis.md` for
the frame-by-frame evidence. It is a **language to apply**, not a set of
characters or scenes to copy: never reuse their specific poses, gags, or
compositions 1:1. What transfers is the *grammar* of how a flat 2D
cut-out character performs — and that grammar is what this skill encodes.

Read `references/animation-language.md` before writing or reviewing any
character-motion code — it has the full operational rules this file only
summarizes. It's organized to match the sections below 1:1.

## The one-sentence version

**Poses and faces carry the performance; the body mostly holds still;
the camera punctuates rather than drifts.** The single most common way
to make a scene look worse than the references is adding continuous
motion everywhere on the assumption that "animation" means "always
moving." Every reference clip proves the opposite: most of a held shot
is genuinely static, and life comes from a few well-timed, well-chosen
changes.

## Hard rules (never violate these)

1. **Never fake motion by stretching/squishing a static PNG** (jaw-flap,
   rubber-stretch limbs). It's a documented temporary fallback in
   `RigCharacter.tsx` for missing mouth-shape art, never a style choice.
2. **Never decide the mouth's state from one frame's raw amplitude.**
   Smooth + hysteresis + minimum hold, computed once as a pure function
   of the whole audio track — see `lib/lipSync.ts` and
   `animation-language.md` §2. Per-frame React state is unsound here
   because Remotion can render frames out of order across workers.
3. **Never leave a listening character fully frozen**, and never give
   them more than one small reaction beat at a time (§5). Both extremes
   are wrong.
4. **Never change a character's design between scenes/cuts.** Consistency
   is non-negotiable — every reference holds this even across location
   changes.
5. **Never let motion, camera, or transitions obscure the target English
   phrase or level badge.** Educational priority (§10) always wins.
6. **Default to pose-based animation, not a skeletal rig** (§6). Only rig
   a character when it's actually been prepared well for it (good
   pivots, real overlap at every joint) — see the rig spec docs already
   in `apps/video/docs/`.
7. **Don't animate without a reason.** If you can't say *why* something
   is moving (a line, an emphasis, a reaction, a cut), cut the motion.

## Quick-reference defaults

These are the numbers already shipped in `apps/video/src/` — reuse them
for a new character rather than re-deriving from scratch; adjust only if
a specific reference clearly calls for something different.

| What | Default | Source |
|---|---|---|
| Blink period / duration | ~3.4s / 5 frames | `RigCharacter.tsx` |
| Head idle sway | ±2.5° / ±3px bob | `RigCharacter.tsx` (only for a continuously-talking host; ease toward 0 for a silent character) |
| Body sway | ±0.8° rotate, ±2px translateX, different phase than head, **no vertical component** | `RigCharacter.tsx` |
| Mouth amplitude gain | ×3.2 on raw `visualizeAudio` bins | `lipSync.ts` |
| Mouth thresholds (post-gain) | mid enter 0.14 / exit 0.08, open enter 0.55 / exit 0.40 | `lipSync.ts` |
| Mouth minimum hold | 4 frames (~130ms @30fps) | `lipSync.ts` |
| Camera push-in | scale ≤1.025, lift ≤8px, eased, punctuation only | `camera.ts` |
| Render quality | CRF 16 | `remotion.config.ts` |
| Bust framing | ~45-55% of frame height, centered | see the aspect-ratio bug writeup in git history if a character looks tiny — check the actual content bounding box, not just the box size |

## Anti-patterns (see `animation-language.md` §7 for the full list)

Rubber-stretched PNGs · cheap jaw-flap as a final solution · visible
breathing loops · constant bounce/spring idle · excessive zoom · a tiny
character lost in empty frame · hard pose-swaps with no transition ·
motion with no traceable reason.

## QA checklist (run before calling any character-animation work done)

- [ ] Typecheck passes (`pnpm typecheck` in `apps/video/`)
- [ ] Freeze a random mid-shot frame — does it read as a natural held
      pose, or like you caught the character mid-fidget?
- [ ] Mouth state changes are visible and stable across several sampled
      frames (extract stills — don't just eyeball the video at full
      speed) — no flicker, no frames stuck permanently closed
- [ ] No transparent gaps at any rig joint through its full range of
      motion (rotate ±30° and check, per the rig spec's own QA note)
- [ ] Camera motion, if any, is tied to a real beat, not a timer with no
      justification (unless explicitly a proof-of-concept simulating
      beat data that doesn't exist yet — say so in a code comment)
- [ ] The target phrase / caption / level badge is never obscured by a
      pose, transition, or camera move
- [ ] A listening character (if any) got exactly one small reaction beat,
      not zero and not several
- [ ] Character design is identical to its established look across every
      scene in the piece

## How to apply this skill

- **Reviewing a rendered preview**: extract a handful of stills (per the
  QA checklist) rather than judging from a description; compare what you
  see against §1 and §7 of `animation-language.md`.
- **Building a new pose-swap gesture**: pick the trigger (line content,
  emphasis, reaction — never "just because"), author or select the two
  poses, and add a transition per §7 (2-4 frame blend + small position
  offset is the default; add anticipation/settle for a bigger gesture).
- **Adding camera motion to a new segment**: default to static. Only add
  a push-in at scene establishment, or a very mild reframe on a genuine
  speaker change — never a continuous drift, never repeating a push
  inside one continuous shot without a new beat justifying it.
- **Wiring lip-sync for a new character**: copy the *pattern* in
  `lipSync.ts` (precompute once, pure function of audio, smoothing +
  hysteresis + hold), not just the thresholds — a different voice/mic
  level may need different numbers, but the shape of the algorithm
  shouldn't change.
- **Multi-character dialogue scene**: follow the scene grammar in
  `animation-language.md` §9 (establish → speaker A → reaction B →
  speaker B → reaction A → emphasis → resolution) as the default shape,
  adapting length/repetition to the actual script.
