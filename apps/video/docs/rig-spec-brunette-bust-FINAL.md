# FINAL asset spec — Brunette in Blue, talking-bust rig (16 layers)

Supersedes the bust subset of `rig-spec-brunette.md` for this round (that
file's full 22-layer table, incl. legs/hips, still stands for later). This
document matches **exactly** what's already implemented and rendering in
`RigTest` (`src/components/rig/RigCharacter.tsx` +
`src/data/rigs/brunetteBust.ts`) — nothing here is aspirational, it's a
description of the working code so real art can drop in with zero code
changes.

Correction from my earlier message: it's **16 layers**, not 15 — listed
and counted below.

## Non-negotiable: canvas contract

**All 16 files: exactly 1000 × 1340 px, PNG-24 with alpha, full shared
canvas — never tight-cropped.**

This isn't a style preference, it's a hard requirement of the current
code: `<Layer>` renders every image at `width:100%; height:100%` of a box
whose aspect ratio is fixed at 1000:1340. A tight-cropped file would be
stretched to fill that box and come out distorted/misaligned. Every
layer must be authored on the same 1000×1340 canvas, in place, with
everything except that one part left transparent — exactly like Photoshop
layers in one document, exported individually.

Coordinate system: origin `(0,0)` top-left, Y increases downward.

## The 16 files, confirmed

| # | File | Role |
|---|---|---|
| 1 | `torso.png` | torso/shoulders |
| 2 | `head_hair_back.png` | hair behind head silhouette |
| 3 | `head_base.png` | face/skin/ears shape |
| 4 | `eyebrows_neutral.png` | eyebrows |
| 5 | `eyes_open.png` | eyes, open state |
| 6 | `eyes_closed.png` | eyes, closed state (blink) |
| 7 | `mouth_closed.png` | mouth, closed |
| 8 | `mouth_mid.png` | mouth, half-open |
| 9 | `mouth_open.png` | mouth, wide open |
| 10 | `head_hair_front.png` | hair/bangs in front of face |
| 11 | `arm_right_upper.png` | right upper arm |
| 12 | `arm_right_fore.png` | right forearm |
| 13 | `hand_right.png` | right hand |
| 14 | `arm_left_upper.png` | left upper arm |
| 15 | `arm_left_fore.png` | left forearm |
| 16 | `hand_left.png` | left hand |

"Left"/"right" = the **character's own** left/right (mirrored on screen —
character's left arm is on the right side of the frame, facing camera).
No hips/legs in this pass, per your last message.

## Pivot / transform-origin — only where the code actually rotates something

The rig only has **7 rotating joints**. Everything else is a static
sibling that moves *with* its parent joint but has no rotation of its own.

| Joint (rotates) | Pivot px | Pivot % (x, y) | Parent joint |
|---|---|---|---|
| Head group (as one unit) | (500, 300) | 50.00%, 22.39% | — (root, rotates against the character box) |
| Right shoulder | (360, 350) | 36.00%, 26.12% | — (root) |
| Right elbow | (340, 560) | 34.00%, 41.79% | Right shoulder |
| Right wrist | (330, 760) | 33.00%, 56.72% | Right elbow |
| Left shoulder | (640, 350) | 64.00%, 26.12% | — (root) |
| Left elbow | (660, 560) | 66.00%, 41.79% | Left shoulder |
| Left wrist | (670, 760) | 67.00%, 56.72% | Left elbow |

- **"Head group"** = `head_hair_back` + `head_base` + `eyebrows_neutral` +
  `eyes_open`/`eyes_closed` + `mouth_closed`/`mid`/`open` +
  `head_hair_front`, all six/nine files nested inside **one** rotation at
  the neck pivot. They don't have individual pivots — they're rigidly
  glued together and only the whole group turns/bobs. The face-state files
  (eyes, mouth) don't rotate at all; they're just shown/hidden (swapped)
  in place.
- **`torso.png`** has no pivot in this version — it's the static root the
  arms and head attach to. (A future idle-sway pass could add one at the
  waist, not needed for this proof-of-concept.)
- **Wrist joints exist and are wired up** (pivot defined, nested correctly)
  even though today's test keeps rotation at 0° there — they're ready for
  hand articulation later without any restructuring.

## Position in neutral pose (what's currently drawn, as a size/placement guide)

These are the bounding boxes the **placeholder** art currently occupies —
match them loosely for consistent proportions, but the numbers that must
be exact are the pivots above, not these boxes:

| File | Approx. bounding box (x0,y0)–(x1,y1) |
|---|---|
| `torso.png` | (330,290)–(670,660) |
| `head_hair_back.png` | (370,50)–(630,320) |
| `head_base.png` | (395,75)–(605,305) |
| `eyebrows_neutral.png` | (420,168)–(472,182) and (528,168)–(580,182) |
| `eyes_open.png` | (420,188)–(472,222) and (528,188)–(580,222) |
| `eyes_closed.png` | (420,199)–(472,211) and (528,199)–(580,211) |
| `mouth_closed.png` | (465,258)–(535,266) |
| `mouth_mid.png` | (465,252)–(535,278) |
| `mouth_open.png` | (460,246)–(540,292) |
| `head_hair_front.png` | (390,60)–(610,220), bottom half (bangs over forehead) |
| `arm_right_upper.png` | ~(295,305)–(405,605) |
| `arm_right_fore.png` | ~(295,515)–(380,805) |
| `hand_right.png` | (300,745)–(360,825) |
| `arm_left_upper.png` | ~(595,305)–(705,605) |
| `arm_left_fore.png` | ~(620,515)–(705,805) |
| `hand_left.png` | (640,745)–(700,825) |

## Overlap requirements (must not show a gap when the joint rotates)

At each of the 7 pivots, both sides of the joint must have art extending
past the pivot line into the other part's territory:

| Joint | Overlap |
|---|---|
| Neck (torso ↔ head group) | `torso.png` extends ~20–30px above the neck pivot (collar/under-chin); `head_base.png`/`head_hair_back.png` extend ~20–30px below it (neck stub) |
| Right/left shoulder (torso ↔ upper arm) | `torso.png` extends ~30px out under each arm; `arm_*_upper.png` extends ~30px in toward the torso, past the shoulder pivot |
| Right/left elbow (upper ↔ forearm) | Both `arm_*_upper.png` and `arm_*_fore.png` extend ~40px past the elbow pivot into each other's territory |
| Right/left wrist (forearm ↔ hand) | Both `arm_*_fore.png` and `hand_*.png` extend ~15–20px past the wrist pivot |

Rule of thumb (same as before): hide every layer except the two meeting
at one joint, rotate the child ±30°, and no transparent gap should show —
only overlapping art.

## Z-order (paint order, back → front — exactly the DOM order in `RigCharacter.tsx`)

1. `torso.png`
2. `arm_right_upper.png`
3. `arm_right_fore.png`
4. `hand_right.png`
5. `head_hair_back.png`
6. `head_base.png`
7. `eyebrows_neutral.png`
8. `eyes_open.png` / `eyes_closed.png` *(same slot, one visible at a time)*
9. `mouth_closed.png` / `mouth_mid.png` / `mouth_open.png` *(same slot, one visible at a time)*
10. `head_hair_front.png`
11. `arm_left_upper.png`
12. `arm_left_fore.png`
13. `hand_left.png`

Right arm is the "back" arm (paints before the head), left arm is the
"front" arm (paints after, so it can cross in front of the torso/head
during a gesture).

## Export checklist

- [ ] All 16 files exactly 1000×1340 px, PNG-24, alpha channel, full shared canvas (no cropping)
- [ ] Neutral pose = arms relaxed at sides, not crossed
- [ ] Character silhouette within the central 70%/85% safe margin (≈ x:150–850, y:60–1290)
- [ ] Pivots above match the joints in your drawing (the 7 in the table) — these are the numbers the code reads, they can't drift from the art
- [ ] Overlap extensions present at all 7 joints per the table above
- [ ] No baked shadow on one part implying a neighboring part's fixed position
- [ ] Same document/artboard for all 16, exported individually — guarantees pixel alignment
