/**
 * lens-renderer.ts - Canvas 2D contact lens & glasses overlay renderer
 * Glasses use realistic SVG image overlays positioned on detected eyes
 */

import type { EyeData } from './face-detector';
import { GLASSES_IMAGES } from './glasses-assets';

export type LensColor = 'clear' | 'blue' | 'green' | 'brown' | 'grey';
export type RenderMode = 'contact' | 'glasses';

const LENS_COLORS: Record<LensColor, { inner: string; outer: string; opacity: number }> = {
  clear:  { inner: 'rgba(180, 210, 255, 0.25)', outer: 'rgba(80, 130, 220, 0.50)',  opacity: 0.40 },
  blue:   { inner: 'rgba(60, 130, 246, 0.55)',  outer: 'rgba(30, 80, 200, 0.75)',   opacity: 0.65 },
  green:  { inner: 'rgba(34, 197, 94, 0.55)',   outer: 'rgba(20, 120, 60, 0.75)',   opacity: 0.65 },
  brown:  { inner: 'rgba(180, 120, 60, 0.55)',  outer: 'rgba(120, 70, 30, 0.75)',   opacity: 0.65 },
  grey:   { inner: 'rgba(150, 150, 150, 0.55)', outer: 'rgba(80, 80, 80, 0.75)',    opacity: 0.65 },
};

const LENS_SIZE_MULTIPLIER = 1.8;
const DEFAULT_GLASSES_SCALE = 2.8;

export class LensRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private color: LensColor = 'clear';
  private mode: RenderMode = 'contact';
  private glassesStyle = 'black';
  private glassesScale = DEFAULT_GLASSES_SCALE;
  private lensScale = LENS_SIZE_MULTIPLIER;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  setColor(color: LensColor) { this.color = color; }
  setMode(mode: RenderMode) { this.mode = mode; }
  setGlassesStyle(style: string) { this.glassesStyle = style; }
  getMode(): RenderMode { return this.mode; }
  setGlassesScale(scale: number) { this.glassesScale = scale; }
  setLensScale(scale: number) { this.lensScale = scale; }
  getGlassesScale() { return this.glassesScale; }
  getLensScale() { return this.lensScale; }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderContactLens(eye: EyeData) {
    const ctx = this.ctx;
    const { irisCenter, irisRadius } = eye;
    const lensRadius = irisRadius * this.lensScale;
    const colorDef = LENS_COLORS[this.color];

    ctx.save();

    // Draw lens with radial gradient (no clipping - works better with glasses)
    const gradient = ctx.createRadialGradient(
      irisCenter.x, irisCenter.y, irisRadius * 0.2,
      irisCenter.x, irisCenter.y, lensRadius
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.25, colorDef.inner);
    gradient.addColorStop(0.6, colorDef.inner);
    gradient.addColorStop(0.85, colorDef.outer);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(irisCenter.x, irisCenter.y, lensRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Lens edge ring
    ctx.beginPath();
    ctx.arc(irisCenter.x, irisCenter.y, lensRadius * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = colorDef.outer;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fresnel highlight
    ctx.beginPath();
    ctx.arc(irisCenter.x, irisCenter.y - irisRadius * 0.1, irisRadius * 0.7, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.strokeStyle = `rgba(255, 255, 255, ${colorDef.opacity * 0.6})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  private renderGlasses(leftEye: EyeData, rightEye: EyeData) {
    const ctx = this.ctx;
    const img = GLASSES_IMAGES[this.glassesStyle] || GLASSES_IMAGES.black;

    if (!img.complete || !img.naturalWidth) return; // image not loaded yet

    // Calculate position and size from eye positions
    const centerX = (leftEye.irisCenter.x + rightEye.irisCenter.x) / 2;
    const centerY = (leftEye.irisCenter.y + rightEye.irisCenter.y) / 2;
    const eyeDistance = Math.abs(rightEye.irisCenter.x - leftEye.irisCenter.x);

    // Glasses image width scaled by eye distance
    const glassesWidth = eyeDistance * this.glassesScale;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const glassesHeight = glassesWidth * aspectRatio;

    // Calculate rotation angle from eye tilt
    const angle = Math.atan2(
      rightEye.irisCenter.y - leftEye.irisCenter.y,
      rightEye.irisCenter.x - leftEye.irisCenter.x
    );

    ctx.save();

    // Translate to center, rotate, then draw
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Draw glasses image centered
    ctx.drawImage(
      img,
      -glassesWidth / 2,
      -glassesHeight / 2,
      glassesWidth,
      glassesHeight
    );

    ctx.restore();
  }

  render(leftEye: EyeData | null, rightEye: EyeData | null) {
    this.clear();
    if (!leftEye || !rightEye) return;

    if (this.mode === 'glasses') {
      this.renderGlasses(leftEye, rightEye);
    } else {
      this.renderContactLens(leftEye);
      this.renderContactLens(rightEye);
    }
  }
}
