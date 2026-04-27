/**
 * glasses-assets.ts - Multi-angle glasses image loader
 * Each style has 3 views: front / sideLeft / sideRight
 * Default: all 3 fall back to the front PNG until overridden via uploadGlassesImage()
 */

import blackUrl      from '../assets/glasses-black.png';
import tortoiseUrl   from '../assets/glasses-tortoise.png';
import goldUrl       from '../assets/glasses-gold.png';
import redUrl        from '../assets/glasses-red.png';
import sunglassesUrl from '../assets/glasses-sunglasses.png';

export type GlassesAngle = 'front' | 'sideLeft' | 'sideRight';

export interface GlassesSet {
  front:     HTMLImageElement;
  sideLeft:  HTMLImageElement;
  sideRight: HTMLImageElement;
}

function loadImage(url: string): HTMLImageElement {
  const img = new Image();
  img.src = url;
  return img;
}

// Default front images (original PNGs)
const DEFAULTS: Record<string, HTMLImageElement> = {
  black:      loadImage(blackUrl),
  tortoise:   loadImage(tortoiseUrl),
  gold:       loadImage(goldUrl),
  red:        loadImage(redUrl),
  sunglasses: loadImage(sunglassesUrl),
};

// Custom overrides per style × angle (set by uploadGlassesImage)
const overrides = new Map<string, Partial<Record<GlassesAngle, HTMLImageElement>>>();

/** Upload / replace a specific angle image for a glasses style */
export function uploadGlassesImage(
  style: string,
  angle: GlassesAngle,
  objectUrl: string,
): void {
  if (!overrides.has(style)) overrides.set(style, {});
  const img = loadImage(objectUrl);
  overrides.get(style)![angle] = img;
}

/** Get the 3-angle set for a style, falling back to front PNG when angle not uploaded */
export function getGlassesSet(style: string): GlassesSet {
  const base   = DEFAULTS[style] || DEFAULTS.black;
  const custom = overrides.get(style) || {};
  return {
    front:     custom.front     || base,
    sideLeft:  custom.sideLeft  || base,
    sideRight: custom.sideRight || base,
  };
}

// Keep backward-compat export so existing code doesn't break
export const GLASSES_IMAGES: Record<string, HTMLImageElement> = DEFAULTS;
