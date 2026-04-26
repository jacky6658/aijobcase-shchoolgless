/**
 * recommendation-engine.ts
 * Rule-based 臉型 → 眼鏡推薦引擎
 * 教育場景：規則透明，學生可以理解搭配邏輯
 */

import type { FaceShape } from './face-shape-analyzer';

export interface GlassesItem {
  id: string;
  name: string;
  item_type: 'glasses' | 'lens';
  image_url: string;
  frame_shape?: string;
  thickness?: string;
  material?: string;
  style?: string;
  suitable_face_types: string[];
  lens_color?: string;
  description?: string;
}

export interface RecommendationResult {
  item: GlassesItem;
  score: number;       // 0~100
  reasons: string[];   // 推薦原因（教育用）
  warnings: string[];  // 不搭配提示
}

// 臉型搭配規則
const FACE_RULES: Record<FaceShape, {
  preferFrames: string[];
  avoidFrames: string[];
  preferStyle: string[];
  tips: string[];
  avoidTips: string[];
}> = {
  round: {
    preferFrames: ['square', 'semi', 'cat_eye'],
    avoidFrames: ['round', 'oval'],
    preferStyle: ['business', 'fashion'],
    tips: ['有角度的方框拉長臉部線條', '半框增加臉部立體感', '貓眼框提升臉頰輪廓'],
    avoidTips: ['圓框會加重臉部圓潤感'],
  },
  oval: {
    preferFrames: ['round', 'square', 'semi', 'rimless', 'cat_eye', 'oval'],
    avoidFrames: [],
    preferStyle: ['business', 'fashion', 'casual'],
    tips: ['鵝蛋臉比例均衡，各種框型皆適合', '可依個人風格自由選擇'],
    avoidTips: [],
  },
  square: {
    preferFrames: ['round', 'oval'],
    avoidFrames: ['square'],
    preferStyle: ['casual', 'fashion', 'vintage'],
    tips: ['圓框柔化方型下巴線條', '橢圓框平衡臉部稜角'],
    avoidTips: ['方框會強化下巴方形感'],
  },
  heart: {
    preferFrames: ['oval', 'round', 'rimless'],
    avoidFrames: ['cat_eye', 'square'],
    preferStyle: ['fashion', 'casual'],
    tips: ['底部較寬的橢圓框平衡寬額頭', '細框無框降低視覺重量', '圓框讓臉部整體更協調'],
    avoidTips: ['上翹貓眼框會加重額頭寬度視覺', '粗方框讓上臉更顯重'],
  },
  long: {
    preferFrames: ['round', 'oval', 'cat_eye'],
    avoidFrames: ['semi', 'rimless'],
    preferStyle: ['fashion', 'sport', 'casual'],
    tips: ['高框度的圓框縮短臉部視覺長度', '貓眼框增加橫向視覺寬度'],
    avoidTips: ['窄半框讓臉顯得更長', '無框視覺上無法縮短臉長'],
  },
};

function scoreItem(item: GlassesItem, faceShape: FaceShape): RecommendationResult {
  const rules = FACE_RULES[faceShape];
  let score = 50; // 基礎分
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 資料庫已標記適合臉型
  if (item.suitable_face_types.includes(faceShape)) {
    score += 30;
    reasons.push('專為此臉型設計');
  }

  if (item.item_type === 'glasses' && item.frame_shape) {
    if (rules.preferFrames.includes(item.frame_shape)) {
      score += 20;
      const tip = rules.tips[rules.preferFrames.indexOf(item.frame_shape)] || rules.tips[0];
      if (tip) reasons.push(tip);
    }
    if (rules.avoidFrames.includes(item.frame_shape)) {
      score -= 25;
      warnings.push(rules.avoidTips[0] || '框型與臉型較不搭配');
    }
  }

  // 風格加分
  if (item.style && rules.preferStyle.includes(item.style)) {
    score += 5;
  }

  return {
    item,
    score: Math.max(0, Math.min(100, score)),
    reasons: reasons.length ? reasons : ['基本搭配'],
    warnings,
  };
}

export function recommend(
  catalog: GlassesItem[],
  faceShape: FaceShape,
  options: { itemType?: 'glasses' | 'lens'; topN?: number } = {}
): RecommendationResult[] {
  const { itemType, topN = 6 } = options;

  const filtered = catalog.filter(item =>
    item.suitable_face_types !== undefined &&
    (itemType ? item.item_type === itemType : true)
  );

  const scored = filtered
    .map(item => scoreItem(item, faceShape))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}

export const FACE_SHAPE_LABELS: Record<FaceShape, string> = {
  round: '圓臉',
  oval: '鵝蛋臉',
  square: '方臉',
  heart: '心型臉',
  long: '長臉',
};

export const FACE_SHAPE_DESCRIPTIONS: Record<FaceShape, string> = {
  round: '臉寬與臉長相近，下巴圓潤',
  oval: '臉長略大於臉寬，比例均衡',
  square: '下巴線條明顯，顴骨與額頭寬度相近',
  heart: '額頭較寬，下巴較尖',
  long: '臉部高度明顯大於寬度',
};
