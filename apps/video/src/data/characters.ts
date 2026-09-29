import { CharacterConfig, CharacterId } from "./types";

/**
 * Source art is 1493x2000 flat-vector portraits (white background, no alpha).
 * eyeRegion / mouthRegion are normalized crops calibrated by eye against the
 * actual artwork -- used by <Character> for the blink and jaw-flap fallback
 * when no `mouthVariants` are supplied yet. Re-calibrate if the art changes.
 */
export const characters: Record<CharacterId, CharacterConfig> = {
  host: {
    id: "host",
    name: "Host (curly brown hair, blue shirt)",
    image: "characters/host/full.jpg",
    eyeRegion: { x: 0.437, y: 0.205, width: 0.147, height: 0.046 },
    mouthRegion: { x: 0.465, y: 0.258, width: 0.09, height: 0.03 },
    aspectRatio: 1493 / 2000,
  },
  blondeGuy: {
    id: "blondeGuy",
    name: "Blonde guy, red headband",
    image: "characters/blonde-guy/full.jpg",
    eyeRegion: { x: 0.438, y: 0.175, width: 0.147, height: 0.055 },
    mouthRegion: { x: 0.458, y: 0.24, width: 0.107, height: 0.025 },
    aspectRatio: 1493 / 2000,
  },
  mustacheMan: {
    id: "mustacheMan",
    name: "Mustache man (pink shirt, green pants)",
    // TODO: not used in Segment 1 yet -- region estimates below are unverified,
    // re-calibrate the same way as host/blondeGuy before using in Doctor/Restaurant.
    image: "characters/mustache-man/full.jpg",
    eyeRegion: { x: 0.437, y: 0.19, width: 0.147, height: 0.05 },
    mouthRegion: { x: 0.46, y: 0.29, width: 0.1, height: 0.03 },
    aspectRatio: 1493 / 2000,
  },
  purpleWoman: {
    id: "purpleWoman",
    name: "Purple-haired woman",
    // TODO: not used in Segment 1 yet -- region estimates below are unverified,
    // re-calibrate the same way as host/blondeGuy before using in Store scene.
    image: "characters/purple-woman/full.jpg",
    eyeRegion: { x: 0.44, y: 0.21, width: 0.14, height: 0.045 },
    mouthRegion: { x: 0.47, y: 0.27, width: 0.09, height: 0.028 },
    aspectRatio: 1493 / 2000,
  },
};
