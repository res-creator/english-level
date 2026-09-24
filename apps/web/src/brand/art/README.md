# Illustration drop-in folder

Put artwork here and it appears in the product. Nothing else to do — no
imports, no component edits, no route changes.

## How it works

The build scans this folder and matches each file to a slot by its
**filename**. A slot with no file renders a simple coded placeholder
instead, so the app is always complete and never shows a broken box.

```
kvo-full-idle.png        → Kvo, variant B, "рядом"
cast-maya-speaking.png   → Майя, speaking
scene-cafe-bg.png        → the café, behind the person
scene-cafe-fg.png        → the café, in front of the person (optional)
```

## Rules

- **Formats:** `.avif`, `.webp`, `.png`, `.jpg`. If several exist for the
  same slot the most modern one wins, in that order.
- **Retina:** add `name@2x.png` and `name@3x.png` next to `name.png` and
  they are used automatically. Shipping one high-resolution file also
  works — CSS sizes the box, so it simply renders sharp.
- **Transparency:** anything that sits _over_ something else (Kvo, people,
  foreground layers, memory objects) must be a transparent PNG/WebP.
  Backdrops and room environments are opaque.
- **No text in the artwork.** Every word in the product is real HTML, in
  Russian or English, and has to stay translatable and selectable. Signs
  and chalkboards inside a scene may carry decorative lettering, but never
  anything the learner is meant to read.
- **Keep the subject clear of the edges** unless the slot is explicitly a
  full-bleed backdrop — several layouts crop.

The authoritative list of slots, sizes and purposes lives in
`../artManifest.ts`.
