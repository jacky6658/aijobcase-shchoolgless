/**
 * face-detector.ts - Face detection using face-api.js
 * No WebGL required - works on CPU via TensorFlow.js
 */

import * as faceapi from 'face-api.js';

export interface EyeData {
  irisCenter: { x: number; y: number };
  irisRadius: number;
  contour: { x: number; y: number }[];
  aperture: number;
}

export interface FaceResult {
  leftEye: EyeData;
  rightEye: EyeData;
  noseBridge?: { x: number; y: number };
  yaw: number;        // -1(左轉) ~ 0(正面) ~ +1(右轉)，raw camera space
  detected: boolean;
  fallback?: boolean;
}

type OnResultCallback = (result: FaceResult) => void;

const SMOOTH_FACTOR = 0.7; // 提高響應速度，減少飄浮感
let prevLeft: EyeData | null = null;
let prevRight: EyeData | null = null;

function smooth(current: EyeData, prev: EyeData | null): EyeData {
  if (!prev) return current;
  return {
    irisCenter: {
      x: prev.irisCenter.x + SMOOTH_FACTOR * (current.irisCenter.x - prev.irisCenter.x),
      y: prev.irisCenter.y + SMOOTH_FACTOR * (current.irisCenter.y - prev.irisCenter.y),
    },
    irisRadius: prev.irisRadius + SMOOTH_FACTOR * (current.irisRadius - prev.irisRadius),
    contour: current.contour.map((pt, i) => ({
      x: (prev.contour[i]?.x ?? pt.x) + SMOOTH_FACTOR * (pt.x - (prev.contour[i]?.x ?? pt.x)),
      y: (prev.contour[i]?.y ?? pt.y) + SMOOTH_FACTOR * (pt.y - (prev.contour[i]?.y ?? pt.y)),
    })),
    aperture: prev.aperture + SMOOTH_FACTOR * (current.aperture - prev.aperture),
  };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * 【PM 決策 #9】口罩／低光補償：從臉部 bounding box 估算眼睛位置
 * 標準臉部比例：
 *   - 眼睛 Y ≈ 臉部頂端往下 33%
 *   - 左眼 X ≈ 臉部左側往右 28%，右眼 X ≈ 72%
 *   - 虹膜半徑 ≈ 臉寬的 8%
 */
function estimateEyeFromFaceBox(
  box: { x: number; y: number; width: number; height: number },
  isLeft: boolean
): EyeData {
  const eyeY  = box.y + box.height * 0.33;
  const eyeX  = isLeft
    ? box.x + box.width * 0.28
    : box.x + box.width * 0.72;
  const radius = box.width * 0.08;

  // 產生 6 個假輪廓點（橢圓近似），讓 smooth() 有東西可以插值
  const contour = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    return { x: eyeX + Math.cos(angle) * radius, y: eyeY + Math.sin(angle) * radius * 0.4 };
  });

  return {
    irisCenter: { x: eyeX, y: eyeY },
    irisRadius: radius,
    contour,
    aperture: 0.3, // 預設半睜眼狀態
  };
}

function extractEyeFromLandmarks(points: faceapi.Point[], isLeft: boolean): EyeData {
  // face-api.js 68-point landmarks:
  // Left eye: points 36-41
  // Right eye: points 42-47
  const eyeStart = isLeft ? 36 : 42;
  const eyeEnd = isLeft ? 41 : 47;

  const eyePoints: { x: number; y: number }[] = [];
  let cx = 0, cy = 0;
  for (let i = eyeStart; i <= eyeEnd; i++) {
    const pt = { x: points[i].x, y: points[i].y };
    eyePoints.push(pt);
    cx += pt.x;
    cy += pt.y;
  }
  cx /= eyePoints.length;
  cy /= eyePoints.length;

  // Eye width and height for radius and aperture
  const outerPt = eyePoints[0]; // outer corner
  const innerPt = eyePoints[3]; // inner corner
  const topPt = eyePoints[1].y < eyePoints[2].y ? eyePoints[1] : eyePoints[2];
  const bottomPt = eyePoints[4].y > eyePoints[5].y ? eyePoints[4] : eyePoints[5];

  const eyeWidth = dist(outerPt, innerPt);
  const eyeHeight = dist(topPt, bottomPt);
  const irisRadius = eyeWidth * 0.18;
  const aperture = eyeWidth > 0 ? eyeHeight / eyeWidth : 0;

  return {
    irisCenter: { x: cx, y: cy },
    irisRadius,
    contour: eyePoints,
    aperture,
  };
}

export async function initFaceDetector(
  videoElement: HTMLVideoElement,
  onResult: OnResultCallback,
  onProgress: (pct: number) => void
): Promise<void> {
  onProgress(20);

  // Load models from CDN
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  onProgress(50);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
  onProgress(70);

  // Start camera
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
  });
  videoElement.srcObject = stream;
  await videoElement.play();

  onProgress(100);

  // Detection options
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.3,
  });

  // Detection loop
  const DETECT_INTERVAL = 120; // ms (~8 FPS)
  let lastDetectTime = 0;
  let detecting = false;

  async function detect() {
    const now = performance.now();

    if (!videoElement.paused && !videoElement.ended && !detecting && (now - lastDetectTime) > DETECT_INTERVAL) {
      detecting = true;
      lastDetectTime = now;

      try {
        const result = await faceapi
          .detectSingleFace(videoElement, options)
          .withFaceLandmarks(true); // true = use tiny model

        if (!result) {
          prevLeft = null;
          prevRight = null;
          onResult({ leftEye: null as any, rightEye: null as any, yaw: 0, detected: false });
        } else {
          const points = result.landmarks.positions;

          let leftEye  = extractEyeFromLandmarks(points, true);
          let rightEye = extractEyeFromLandmarks(points, false);

          // 【PM 決策 #9】口罩補償：若眼部 aperture 過低（眼睛被遮擋）
          // 改用臉部 bounding box 估算位置，避免定位漂移
          const APERTURE_THRESHOLD = 0.05; // 低於此值視為眼部偵測不可靠
          const box = result.detection.box;
          let usedFallback = false;

          if (leftEye.aperture < APERTURE_THRESHOLD) {
            leftEye = estimateEyeFromFaceBox(box, true);
            usedFallback = true;
          }
          if (rightEye.aperture < APERTURE_THRESHOLD) {
            rightEye = estimateEyeFromFaceBox(box, false);
            usedFallback = true;
          }

          leftEye  = smooth(leftEye,  prevLeft);
          rightEye = smooth(rightEye, prevRight);
          prevLeft  = leftEye;
          prevRight = rightEye;

          // 鼻樑頂點（用於眼鏡垂直錨定）
          const nosePt = points[27];
          const noseBridge = nosePt ? { x: nosePt.x, y: nosePt.y } : undefined;

          // 頭部左右偏轉 yaw：用左右臉邊界 + 鼻尖估算
          // points[0]=左臉邊, points[16]=右臉邊, points[30]=鼻尖
          const leftBound  = points[0];
          const rightBound = points[16];
          const noseTip    = points[30];
          let yaw = 0;
          if (leftBound && rightBound && noseTip) {
            const faceCenter = (leftBound.x + rightBound.x) / 2;
            const halfWidth  = Math.abs(rightBound.x - leftBound.x) / 2;
            yaw = halfWidth > 0 ? (noseTip.x - faceCenter) / halfWidth : 0;
          }

          onResult({ leftEye, rightEye, noseBridge, yaw, detected: true, fallback: usedFallback });
        }
      } catch (e) {
        // Skip frame
      }
      detecting = false;
    }
    requestAnimationFrame(detect);
  }

  detect();
}
