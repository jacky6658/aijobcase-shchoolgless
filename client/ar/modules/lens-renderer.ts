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
  private yaw = 0;           // -1.0 ~ 1.0，由外部每幀更新
  private glassesImg: HTMLImageElement | null = null; // 動態載入的圖片（後台匯入）

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
  setYaw(yaw: number) { this.yaw = yaw; }

  /** 設定動態圖片（後台匯入的眼鏡/隱眼），傳 null 則回用預設 */
  setDynamicImage(img: HTMLImageElement | null) { this.glassesImg = img; }

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
    // 優先用動態圖（後台匯入），其次用靜態預設
    const img = this.glassesImg ?? GLASSES_IMAGES[this.glassesStyle] ?? GLASSES_IMAGES.black;

    if (!img.complete || !img.naturalWidth) return;

    const centerX = (leftEye.irisCenter.x + rightEye.irisCenter.x) / 2;
    const centerY = (leftEye.irisCenter.y + rightEye.irisCenter.y) / 2;
    const eyeDistance = Math.abs(rightEye.irisCenter.x - leftEye.irisCenter.x);
    const glassesWidth = eyeDistance * this.glassesScale;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const glassesHeight = glassesWidth * aspectRatio;

    const tiltAngle = Math.atan2(
      rightEye.irisCenter.y - leftEye.irisCenter.y,
      rightEye.irisCenter.x - leftEye.irisCenter.x
    );

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(tiltAngle);

    // ── 左右擺頭透視效果 ──────────────────────────────
    // yaw: -1(左轉最大) ~ 0(正面) ~ 1(右轉最大)
    // 用水平 shear + 非均勻縮放模擬透視壓縮
    const yaw = Math.max(-0.7, Math.min(0.7, this.yaw));

    if (Math.abs(yaw) > 0.03) {
      // xScale: 正面=1.0，側轉時因透視顯得較窄
      const xScale = 1 - Math.abs(yaw) * 0.25;
      // shear: 讓眼鏡隨頭部旋轉傾斜（平行四邊形效果）
      const shear = yaw * 0.18;

      // transform(a, b, c, d, e, f) = [a c] [b d] 矩陣
      // 結合 xScale 和水平 shear
      ctx.transform(xScale, 0, shear, 1, 0, 0);

      // 右轉時陰影在左側，左轉時在右側（增加立體感）
      const shadowX = yaw * glassesWidth * 0.06;
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = shadowX;
      ctx.shadowOffsetY = 2;
    }

    ctx.drawImage(img, -glassesWidth / 2, -glassesHeight / 2, glassesWidth, glassesHeight);
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
