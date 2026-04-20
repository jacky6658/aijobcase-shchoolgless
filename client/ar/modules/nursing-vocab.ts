/**
 * nursing-vocab.ts
 * 護理情境語音辨識後處理：Web Speech API 對醫護術語常誤判，
 * 此模組做兩件事：
 * 1. pickBestAlternative — 從多候選中挑含最多護理關鍵字的那句
 * 2. correctTranscript   — 常見同音誤字修正
 */

// 護理 / 隱形眼鏡教學場景高頻關鍵字（用於 pickBest 評分）
export const NURSING_KEYWORDS = [
  '隱形眼鏡', '隱眼', '眼鏡', '鏡片', '角膜', '眼瞼', '眼睛',
  '配戴', '佩戴', '摘除', '取下', '清洗', '消毒',
  '食鹽水', '生理食鹽水', '藥水', '護理液',
  '洗手', '手衛生', '七步洗手', '口罩', '感染', '無菌',
  '步驟', '流程', '注意事項', '禁忌', '副作用',
  '老師', '同學', '操作', '練習', '示範',
];

// 常見 Web Speech 誤判 → 正確寫法
// 規則：key 用正則，value 用目標字串
// 只挑幾項高頻誤判，避免過度修正破壞原意
const CORRECTIONS: Array<[RegExp, string]> = [
  [/印象眼鏡/g, '隱形眼鏡'],
  [/隱型眼鏡/g, '隱形眼鏡'],
  [/印形眼鏡/g, '隱形眼鏡'],
  [/因為眼鏡/g, '隱形眼鏡'],
  [/隱言/g, '隱眼'],
  [/英嚴/g, '隱眼'],
  [/鏡面/g, '鏡片'],      // 常誤聽，但要小心——僅在後接「清洗/消毒/反面」等動詞情境
  [/生理食言水/g, '生理食鹽水'],
  [/食言水/g, '食鹽水'],
  [/戚步洗手/g, '七步洗手'],
  [/齊步洗手/g, '七步洗手'],
  [/無鏡操作/g, '無菌操作'],
  [/無景/g, '無菌'],
  [/角模/g, '角膜'],
  [/眼檢/g, '眼瞼'],
  [/沛戴/g, '配戴'],
  [/摘出/g, '摘除'],
  [/消讀/g, '消毒'],
];

/**
 * 從 SpeechRecognitionAlternative 陣列挑出「含最多護理關鍵字」的那一句。
 * 若全部都沒命中，回 alternatives[0]（信心最高的原始結果）。
 */
export function pickBestAlternative(
  alternatives: Array<{ transcript: string; confidence?: number }>,
): string {
  if (!alternatives || alternatives.length === 0) return '';
  if (alternatives.length === 1) return alternatives[0].transcript;

  let best = alternatives[0];
  let bestScore = scoreByKeywords(best.transcript);

  for (let i = 1; i < alternatives.length; i++) {
    const score = scoreByKeywords(alternatives[i].transcript);
    // 含更多關鍵字就換；分數相同保留信心較高者（i=0 先進 best）
    if (score > bestScore) {
      best = alternatives[i];
      bestScore = score;
    }
  }
  return best.transcript;
}

function scoreByKeywords(text: string): number {
  let count = 0;
  for (const kw of NURSING_KEYWORDS) {
    if (text.includes(kw)) count++;
  }
  return count;
}

/**
 * 套用同音誤字修正表
 */
export function correctTranscript(raw: string): string {
  let text = raw;
  for (const [pattern, replacement] of CORRECTIONS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}
