/**
 * glasses-assets.ts - Load real glasses PNG images for AR overlay
 */

import blackUrl from '../assets/glasses-black.png';
import tortoiseUrl from '../assets/glasses-tortoise.png';
import goldUrl from '../assets/glasses-gold.png';
import redUrl from '../assets/glasses-red.png';
import sunglassesUrl from '../assets/glasses-sunglasses.png';

function loadImage(url: string): HTMLImageElement {
  const img = new Image();
  img.src = url;
  return img;
}

export const GLASSES_IMAGES: Record<string, HTMLImageElement> = {
  black: loadImage(blackUrl),
  tortoise: loadImage(tortoiseUrl),
  gold: loadImage(goldUrl),
  red: loadImage(redUrl),
  sunglasses: loadImage(sunglassesUrl),
};
