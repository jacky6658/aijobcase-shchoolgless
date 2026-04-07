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
  detected: boolean;
}

type OnResultCallback = (result: FaceResult) => void;

const SMOOTH_FACTOR = 0.35;
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
          onResult({ leftEye: null as any, rightEye: null as any, detected: false });
        } else {
          const points = result.landmarks.positions;

          let leftEye = extractEyeFromLandmarks(points, true);
          let rightEye = extractEyeFromLandmarks(points, false);

          leftEye = smooth(leftEye, prevLeft);
          rightEye = smooth(rightEye, prevRight);
          prevLeft = leftEye;
          prevRight = rightEye;

          onResult({ leftEye, rightEye, detected: true });
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
