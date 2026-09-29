# Rig asset specification — Brunette in Blue (host)

Proof-of-concept for a true hierarchical 2D cut-out rig, matching how the
`Character.tsx` component will be rewritten to consume it (nested DOM
transforms, not the current flat-image jaw-flap). No code has been changed
for this yet — spec only, per your instruction.

## Coordinate system

- Origin `(0,0)` = top-left. Y increases **downward** (standard image/CSS,
  not math/Y-up).
- All pivot coordinates below are given in **pixels on the master canvas**
  and as **% of canvas** (use the % — it's what the component will actually
  read, so it survives you tweaking the px grid).

## Master canvas

**Every layer is exported at the same canvas size: 1000 × 1340 px, transparent PNG-24 (RGBA).**

This is the key simplification that makes hierarchical nesting work without
per-part offset math: each file is a full sheet the size of the whole
character, with only that one body part drawn on it and everything else
transparent. Layers stack exactly on top of each other; only the rotation
*pivot point* differs per layer. (This is ~3.2x the character's current
on-screen size in the composition — 1000px vs. ~307px displayed — so it
stays crisp if we ever push in for a close-up.)

- Character silhouette must sit within the **central 70% width / 85% height**
  of the canvas (roughly x: 150–850, y: 60–1290), leaving margin on every
  side so a raised arm or turned head doesn't clip the canvas edge when
  rotated.
- **Neutral pose is NOT the existing arms-crossed portrait.** Draw a new
  rest pose: arms relaxed at the sides (very slight elbow bend is fine),
  legs straight, weight even, facing camera. Crossed arms can't be
  separated into a shoulder→elbow→wrist chain.

## Layer list, hierarchy, and pivots

"Left" / "Right" = the **character's own** left/right (so "left arm"
appears on the right side of the frame, facing the viewer). Pivot = the
point that layer rotates around (the joint), given as the position of that
joint **in neutral pose**, same coordinate space for every layer since all
canvases are identical.

| # | Layer (file) | Parent | Pivot (joint) | Pivot px | Pivot % (x, y) |
|---|---|---|---|---|---|
| 1 | `leg_right_thigh.png` | hips | right hip | (440, 680) | 44.0%, 50.7% |
| 2 | `leg_right_shin.png` | leg_right_thigh | right knee | (445, 980) | 44.5%, 73.1% |
| 3 | `foot_right.png` | leg_right_shin | right ankle | (450, 1220) | 45.0%, 91.0% |
| 4 | `leg_left_thigh.png` | hips | left hip | (560, 680) | 56.0%, 50.7% |
| 5 | `leg_left_shin.png` | leg_left_thigh | left knee | (555, 980) | 55.5%, 73.1% |
| 6 | `foot_left.png` | leg_left_shin | left ankle | (550, 1220) | 55.0%, 91.0% |
| 7 | `arm_right_upper.png` | torso | right shoulder | (360, 350) | 36.0%, 26.1% |
| 8 | `arm_right_fore.png` | arm_right_upper | right elbow | (340, 560) | 34.0%, 41.8% |
| 9 | `hand_right.png` | arm_right_fore | right wrist | (330, 760) | 33.0%, 56.7% |
| 10 | `torso.png` | hips | waist/neck-base | hip-join (500, 650); neck (500, 300) | 50.0%, 48.5% / 50.0%, 22.4% |
| 11 | `head_hair_back.png` | head group | (moves with head, see below) | — | — |
| 12 | `head_base.png` | torso | neck | (500, 300) | 50.0%, 22.4% |
| 13 | `eyebrows_neutral.png` | head_base | (static, no independent rotation) | — | — |
| 14 | `eyes_open.png` | head_base | (static) | — | — |
| 15 | `eyes_closed.png` | head_base | (static — swapped with #14, not both shown) | — | — |
| 16 | `mouth_closed.png` | head_base | (static) | — | — |
| 17 | `mouth_mid.png` | head_base | (static — swapped with #16/#18) | — | — |
| 18 | `mouth_open.png` | head_base | (static — swapped) | — | — |
| 19 | `head_hair_front.png` | head group | (moves with head, drawn after face) | — | — |
| 20 | `arm_left_upper.png` | torso | left shoulder | (640, 350) | 64.0%, 26.1% |
| 21 | `arm_left_fore.png` | arm_left_upper | left elbow | (660, 560) | 66.0%, 41.8% |
| 22 | `hand_left.png` | arm_left_fore | left wrist | (670, 760) | 67.0%, 56.7% |

`hips` itself has no art (it's an invisible anchor group at the character's
root — pivot (500, 680) / 50.0%, 50.7% — the whole rig's origin point). If
you want visible pelvis/waistband detail, put it on `torso.png` — the torso
art can extend down to the hip line without needing its own layer.

"Head group" = `head_hair_back` + `head_base` + face layers (13–18) +
`head_hair_front`, all rigidly parented to the same neck pivot (500, 300)
as one unit (they don't rotate relative to each other — moving/rotating
the head moves all of them together; only the face layers *swap* between
states, they don't rotate independently).

### Z-order (paint order, back → front = table order above)

Back leg (right) → front leg (left) → torso → back arm (right) → head → front arm (left).
This matches how the reference clips read the character: mostly
front-facing, one arm/hand can gesture in front of the torso, the other
stays tucked slightly behind.

## Overlap requirement at every joint

Rotation must never reveal a gap ("broken joint") between parent and
child parts. At each pivot, **extend both the parent's and the child's
silhouette ~15–20% of that limb segment's own length past the joint line**,
so there's always overlapping flesh/fabric hidden behind the child part in
neutral pose:

- Shoulder: upper-arm art extends ~30px above the shoulder pivot into the
  torso's territory; torso art extends ~30px out under the arm.
- Elbow: upper-arm extends ~40px past (660,560)/(340,560) toward the
  forearm; forearm extends ~40px back up past the same point toward the
  upper arm.
- Wrist, hip, knee, ankle, neck: same idea, ~15–20% of the adjacent
  segment's length.

Rule of thumb: if you hid every layer except the two meeting at one joint
and rotated the child ±30°, no canvas/gap should show through — only
overlapping character art.

## Transparent padding

- Canvas margin (character silhouette to canvas edge): **≥15%** on every
  side, as above.
- Per-part padding isn't needed *inside* the shared canvas approach — every
  layer already has the full canvas as "padding" around its one part.

## Naming

```
public/characters/host/rig/
  torso.png
  head_hair_back.png
  head_base.png
  head_hair_front.png
  eyebrows_neutral.png
  eyes_open.png
  eyes_closed.png
  mouth_closed.png
  mouth_mid.png
  mouth_open.png
  arm_left_upper.png
  arm_left_fore.png
  hand_left.png
  arm_right_upper.png
  arm_right_fore.png
  hand_right.png
  leg_left_thigh.png
  leg_left_shin.png
  foot_left.png
  leg_right_thigh.png
  leg_right_shin.png
  foot_right.png
```

22 files for the full hierarchy as you specified. If that's too much for
a first pass, the ones that matter for Segment 1 (a talking bust shot) are
`torso`, `head_*`, `eyebrows_neutral`, `eyes_*`, `mouth_*`, and both arms —
legs can follow once the rig itself is proven out, since they're off-frame
in a close two-shot anyway.

## Export settings

- PNG-24 with alpha (no flattened white background).
- No part-specific baked shadows that assume a neighboring part's fixed
  position (e.g. don't paint a shadow of the upper arm onto the torso layer
  — it'll look wrong the moment the arm rotates). Keep shading local to
  each part.
- Same canvas (1000×1340) and pixel-for-pixel alignment across all 22
  files — export from one Photoshop/Illustrator doc with the parts on
  separate layers/artboards of identical size, not 22 separately-cropped
  documents.

A reference grid image (canvas outline + every pivot point labeled) is
attached separately — import it as a guide layer at 1000×1340 in your
drawing tool and draw the rig directly on top of it.
