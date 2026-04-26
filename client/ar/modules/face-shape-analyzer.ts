/**
 * face-shape-analyzer.ts
 * 從 face-api.js 68 個特徵點計算：
 *   1. yaw 偏轉角（左右擺頭）
 *   2. 臉型分類
 *
 * 68-point landmark 索引：
 *   0-16  jaw outline（下巴輪廓）
 *   17-21 left eyebrow
 *   22-26 right eyebrow
 *   27-30 nose bridge
 *   30-35 nose base
 *   36-41 left eye
 *   42-47 right eye
 *   48-67 mouth
 */

import type { Point } from 'face-api.js';

export type FaceShape = 'round' | 'oval' | 'square' | 'heart' | 'long';

export interface FaceAnalysis {
  yaw: number;          // -1.0 ~ 1.0（負=左轉，正=右轉）
  yawDeg: number;       // 換算成角度（-45 ~ 45）
  faceShape: FaceShape | null;
  confidence: number;   // 0~1
}

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * 用鼻尖相對下巴兩端的比例計算 yaw
 * 正面時比例 ≈ 1.0；右轉時鼻尖偏右，左轉時偏左
 */
export function calcYaw(points: Point[]): number {
  const leftJaw = points[0];   // 下巴左端
  const rightJaw = points[16]; // 下巴右端
  const noseTip = points[30];  // 鼻尖

  const totalWidth = rightJaw.x - leftJaw.x;
  if (totalWidth < 1) return 0;

  const leftRatio = (noseTip.x - leftJaw.x) / totalWidth;
  // leftRatio: 0.5 = 正面, >0.5 = 右轉, <0.5 = 左轉
  const yaw = (leftRatio - 0.5) * 2; // 正規化到 -1 ~ 1
  return Math.max(-1, Math.min(1, yaw));
}

/**
 * 依照臉部幾何比例分類臉型
 */
export function classifyFaceShape(points: Point[]): { shape: FaceShape; confidence: number } {
  // 臉寬：顴骨最寬處（約 point 1 ~ 15 之間，取 2 和 14）
  const cheekWidth = dist(points[2], points[14]);

  // 下巴寬（points 5 和 11）
  const jawWidth = dist(points[5], points[11]);

  // 下巴尖（point 8）到下巴底線中點
  const chinTip = points[8];

  // 額頭估算：眉毛上方（取眉毛最高點向上估算）
  const leftBrow = points[19];
  const rightBrow = points[24];
  const foreheadWidth = dist(leftBrow, rightBrow) * 1.3; // 額頭比眉毛稍寬

  // 臉高：鼻尖到下巴 * 3（整體臉部高度估算）
  const noseTip = points[30];
  const faceHeight = dist(noseTip, chinTip) * 2.8;

  // 長寬比
  const ratio = faceHeight / cheekWidth;

  // 下巴圓度：下巴兩側 point 6, 7, 8, 9, 10 的弧度
  const jawLeft = points[6];
  const jawRight = points[10];
  const jawMid = points[8];
  const jawCurve = (dist(jawLeft, jawMid) + dist(jawRight, jawMid)) / dist(jawLeft, jawRight);

  // 額頭 vs 下巴比
  const topBottomRatio = foreheadWidth / jawWidth;

  // 分類規則
  if (ratio > 1.6) {
    // 長臉：高寬比大
    return { shape: 'long', confidence: Math.min((ratio - 1.6) * 2, 1) };
  }

  if (topBottomRatio > 1.25) {
    // 心型臉：額頭明顯比下巴寬
    return { shape: 'heart', confidence: Math.min((topBottomRatio - 1.25) * 3, 1) };
  }

  if (jawCurve < 1.15 && jawWidth / cheekWidth > 0.85) {
    // 方臉：下巴較直且寬
    return { shape: 'square', confidence: 0.7 };
  }

  if (ratio < 1.2 && jawCurve > 1.3) {
    // 圓臉：低長寬比＋圓下巴
    return { shape: 'round', confidence: Math.min((1.3 - ratio + jawCurve - 1.3) * 2, 1) };
  }

  // 預設：鵝蛋臉
  return { shape: 'oval', confidence: 0.6 };
}

export function analyzeFace(points: Point[]): FaceAnalysis {
  if (!points || points.length < 68) {
    return { yaw: 0, yawDeg: 0, faceShape: null, confidence: 0 };
  }

  const yaw = calcYaw(points);
  const yawDeg = yaw * 45;
  const { shape, confidence } = classifyFaceShape(points);

  return { yaw, yawDeg, faceShape: shape, confidence };
}
