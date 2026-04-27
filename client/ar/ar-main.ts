/**
 * ar-main.ts - Main AR application entry point
 * Orchestrates face detection, lens rendering, guidance, chat, and session recording
 */

import { initFaceDetector, type FaceResult } from './modules/face-detector';
import { LensRenderer, type LensColor } from './modules/lens-renderer';
import { uploadGlassesImage, type GlassesAngle } from './modules/glasses-assets';
import { GuidanceController } from './modules/guidance-controller';
import { VoiceInput } from './modules/voice-input';
import { sendChatMessage, getUserInfo } from './modules/ar-chat';
import { SessionRecorder } from './modules/session-recorder';

// DOM elements
const loadingScreen = document.getElementById('loading-screen')!;
const loadingStatus = document.getElementById('loading-status')!;
const loadingBar = document.getElementById('loading-bar')!;
const cameraDenied = document.getElementById('camera-denied')!;
const arApp = document.getElementById('ar-app')!;
const noFaceMsg = document.getElementById('no-face-msg')!;
const video = document.getElementById('camera-video') as HTMLVideoElement;
const canvas = document.getElementById('lens-canvas') as HTMLCanvasElement;
const stepsList = document.getElementById('steps-list')!;
const chatMessages = document.getElementById('chat-messages')!;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const btnMic = document.getElementById('btn-mic')!;
const btnSend = document.getElementById('btn-send')!;
const voiceTimer = document.getElementById('voice-timer')!;
const voiceCountdown = document.getElementById('voice-countdown')!;
const btnStart = document.getElementById('btn-start')!;
const btnPause = document.getElementById('btn-pause')!;
const btnResume = document.getElementById('btn-resume')!;
const btnEnd = document.getElementById('btn-end')!;
const sessionTimer = document.getElementById('session-timer')!;
const timerDisplay = document.getElementById('timer-display')!;
const userName = document.getElementById('user-name')!;

// State
let sessionActive = false;
let sessionPaused = false;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let latestFaceResult: FaceResult | null = null;

// Modules
const renderer = new LensRenderer(canvas);
const recorder = new SessionRecorder();
const guidance = new GuidanceController((type, stepId) => {
  recorder.logEvent(type, stepId);
  guidance.renderStepsList(stepsList);
});

const voiceInput = new VoiceInput(
  (text) => handleSendMessage(text),
  (listening, countdown) => {
    voiceTimer.classList.toggle('hidden', !listening);
    voiceCountdown.textContent = String(countdown);
    btnMic.classList.toggle('bg-red-500/50', listening);
    btnMic.classList.toggle('bg-white/10', !listening);
  }
);

// Check auth
const userInfo = getUserInfo();
if (!userInfo) {
  window.location.href = '/';
} else {
  userName.textContent = userInfo.name;
  // Hide "返回系統" link for students (AR is their main page)
  const backLink = document.querySelector('#top-bar a[href="/"]') as HTMLElement;
  if (userInfo.role === 'STUDENT' && backLink) {
    backLink.innerHTML = `
      <span class="text-sm cursor-pointer" onclick="localStorage.removeItem('edumind_token');localStorage.removeItem('edumind_user');window.location.href='/';">登出</span>
    `;
  }
}

// Initialize
async function init() {
  loadingStatus.textContent = '正在載入 AI 臉部辨識模型...';
  loadingBar.style.width = '30%';

  try {
    await initFaceDetector(
      video,
      onFaceResult,
      (pct) => {
        loadingBar.style.width = `${pct}%`;
        loadingStatus.textContent = pct < 50 ? '正在載入 AI 模型...' : pct < 90 ? '正在初始化攝影機...' : '載入完成！';
        if (pct >= 100) {
          setTimeout(() => {
            loadingScreen.classList.add('hidden');
            arApp.classList.remove('hidden');
            resizeCanvas();
          }, 500);
        }
      }
    );
  } catch (err: any) {
    console.error('Face detector init failed:', err);
    const msg = err?.message || String(err);
    if (msg.includes('getUserMedia') || msg.includes('Permission') || msg.includes('NotAllowed') || (err instanceof Event)) {
      loadingScreen.classList.add('hidden');
      cameraDenied.classList.remove('hidden');
      cameraDenied.classList.add('flex');
    } else {
      loadingStatus.textContent = `載入失敗: ${msg.substring(0, 100)}`;
    }
    return;
  }

  // Render initial guidance
  guidance.renderStepsList(stepsList);
}

// Resize canvas to match video
function resizeCanvas() {
  const w = video.videoWidth || window.innerWidth;
  const h = video.videoHeight || window.innerHeight;
  renderer.resize(w, h);
  console.log(`Canvas resized: ${w}x${h}`);
}

video.addEventListener('loadedmetadata', resizeCanvas);
video.addEventListener('playing', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// 60fps 獨立渲染迴圈，與 8fps 偵測分離
function renderLoop() {
  if (latestFaceResult?.detected) {
    renderer.render(latestFaceResult.leftEye, latestFaceResult.rightEye, latestFaceResult.noseBridge, latestFaceResult.yaw);
  } else {
    renderer.clear();
  }
  requestAnimationFrame(renderLoop);
}
renderLoop();

// Face detection callback（只更新資料，不直接 render）
function onFaceResult(result: FaceResult) {
  latestFaceResult = result;
  if (!result.detected) {
    noFaceMsg.classList.remove('hidden');
    return;
  }
  noFaceMsg.classList.add('hidden');
  updateOpticsPanel(result);
}

// Size slider
const sizeRange = document.getElementById('size-range') as HTMLInputElement;
const sizeLabel = document.getElementById('size-label')!;

sizeRange.addEventListener('input', () => {
  const pct = parseInt(sizeRange.value, 10);
  sizeLabel.textContent = `${pct}%`;
  const mode = renderer.getMode();
  if (mode === 'glasses') {
    renderer.setGlassesScale(2.8 * (pct / 100));
  } else {
    renderer.setLensScale(1.8 * (pct / 100));
  }
});

// Fullscreen toggle
const btnFullscreen = document.getElementById('btn-fullscreen')!;
btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Practice history modal
const btnHistory = document.getElementById('btn-history')!;
const historyModal = document.getElementById('history-modal')!;
const historyClose = document.getElementById('history-close')!;
const historyBackdrop = document.getElementById('history-backdrop')!;
const historyList = document.getElementById('history-list')!;

async function loadHistory() {
  const token = localStorage.getItem('edumind_token');
  if (!token) return;
  historyList.innerHTML = '<div class="text-center text-white/40 text-sm py-8">載入中...</div>';
  try {
    const res = await fetch('/api/ar-practice/sessions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success || !json.data.length) {
      historyList.innerHTML = '<div class="text-center text-white/40 text-sm py-8">尚無練習紀錄</div>';
      return;
    }
    historyList.innerHTML = json.data.map((s: any) => {
      const date = new Date(s.created_at || s.started_at).toLocaleString('zh-TW');
      const dur = s.duration_seconds ? `${Math.floor(s.duration_seconds / 60)}分${s.duration_seconds % 60}秒` : '--';
      const statusColor = s.status === 'COMPLETED' ? 'text-green-400' : s.status === 'IN_PROGRESS' ? 'text-yellow-400' : 'text-red-400';
      const statusText = s.status === 'COMPLETED' ? '已完成' : s.status === 'IN_PROGRESS' ? '進行中' : '未完成';
      return `<div class="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
        <div>
          <div class="text-xs text-white/80">${date}</div>
          <div class="text-[10px] text-white/40 mt-0.5">完成 ${s.steps_completed ?? 0}/6 步驟 · ${dur}</div>
        </div>
        <span class="text-xs font-medium ${statusColor}">${statusText}</span>
      </div>`;
    }).join('');
  } catch {
    historyList.innerHTML = '<div class="text-center text-red-400 text-sm py-8">載入失敗</div>';
  }
}

btnHistory.addEventListener('click', () => {
  historyModal.classList.remove('hidden');
  loadHistory();
});
historyClose.addEventListener('click', () => historyModal.classList.add('hidden'));
historyBackdrop.addEventListener('click', () => historyModal.classList.add('hidden'));

// Mobile FAB: toggle bottom-sheet panels (guidance / chat)
const guidancePanel = document.getElementById('guidance-panel')!;
const chatPanel = document.getElementById('chat-panel')!;
const fabGuidance = document.getElementById('mobile-fab-guidance');
const fabChat = document.getElementById('mobile-fab-chat');
fabGuidance?.addEventListener('click', () => {
  chatPanel.classList.remove('panel-open');
  guidancePanel.classList.toggle('panel-open');
});
fabChat?.addEventListener('click', () => {
  guidancePanel.classList.remove('panel-open');
  chatPanel.classList.toggle('panel-open');
});

// Mode toggle (contact lens / glasses)
const modeContact = document.getElementById('mode-contact')!;
const modeGlasses = document.getElementById('mode-glasses')!;
const contactOptions = document.getElementById('contact-options')!;
const glassesOptions = document.getElementById('glasses-options')!;

modeContact.addEventListener('click', () => {
  renderer.setMode('contact');
  modeContact.classList.add('active');
  modeGlasses.classList.remove('active');
  contactOptions.classList.remove('hidden');
  glassesOptions.classList.add('hidden');
  // Reset size slider to current lens scale
  sizeRange.value = String(Math.round((renderer.getLensScale() / 1.8) * 100));
  sizeLabel.textContent = `${sizeRange.value}%`;
});

modeGlasses.addEventListener('click', () => {
  renderer.setMode('glasses');
  modeGlasses.classList.add('active');
  modeContact.classList.remove('active');
  glassesOptions.classList.remove('hidden');
  contactOptions.classList.add('hidden');
  // Reset size slider to current glasses scale
  sizeRange.value = String(Math.round((renderer.getGlassesScale() / 2.8) * 100));
  sizeLabel.textContent = `${sizeRange.value}%`;
});

// Lens color selection
document.querySelectorAll('.lens-color-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lens-color-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderer.setColor((btn as HTMLElement).dataset.color as LensColor);
  });
});

// Glasses style selection
document.querySelectorAll('.glasses-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.glasses-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderer.setGlassesStyle((btn as HTMLElement).dataset.glasses!);
  });
});

// Chat
function addChatMessage(text: string, role: 'user' | 'ai') {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function handleSendMessage(text: string) {
  if (!text.trim()) return;
  chatInput.value = '';

  addChatMessage(text, 'user');
  recorder.logEvent('CHAT_QUESTION', undefined, { text });

  const aiMsg = addChatMessage('', 'ai');
  let aiText = '';

  await sendChatMessage(
    text,
    null,
    (token) => {
      aiText += token;
      aiMsg.textContent = aiText;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    () => { /* done */ },
    (err) => { aiMsg.textContent = `錯誤: ${err}`; }
  );
}

btnSend.addEventListener('click', () => handleSendMessage(chatInput.value));
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSendMessage(chatInput.value);
});

// Voice
btnMic.addEventListener('click', () => {
  if (!voiceInput.isSupported()) {
    alert('您的瀏覽器不支援語音辨識');
    return;
  }
  voiceInput.start();
  recorder.logEvent('VOICE_QUESTION');
});

// Session controls
function updateTimer() {
  const secs = recorder.getElapsedSeconds();
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  timerDisplay.textContent = `${mm}:${ss}`;
}

btnStart.addEventListener('click', async () => {
  await recorder.startSession();
  guidance.reset();
  guidance.start();
  guidance.renderStepsList(stepsList);

  sessionActive = true;
  sessionPaused = false;
  btnStart.classList.add('hidden');
  btnPause.classList.remove('hidden');
  btnEnd.classList.remove('hidden');
  sessionTimer.classList.remove('hidden');

  timerInterval = setInterval(updateTimer, 1000);
});

btnPause.addEventListener('click', () => {
  sessionPaused = true;
  btnPause.classList.add('hidden');
  btnResume.classList.remove('hidden');
  recorder.logEvent('PAUSE');
});

btnResume.addEventListener('click', () => {
  sessionPaused = false;
  btnResume.classList.add('hidden');
  btnPause.classList.remove('hidden');
  recorder.logEvent('RESUME');
});

btnEnd.addEventListener('click', async () => {
  if (timerInterval) clearInterval(timerInterval);
  const completed = guidance.getCompletedCount();
  const status = guidance.isCompleted() ? 'COMPLETED' : 'ABANDONED';
  await recorder.endSession(completed, status);

  sessionActive = false;
  sessionPaused = false;
  btnEnd.classList.add('hidden');
  btnPause.classList.add('hidden');
  btnResume.classList.add('hidden');
  btnStart.classList.remove('hidden');

  addChatMessage(
    `練習結束！完成 ${completed}/6 步驟，用時 ${timerDisplay.textContent}`,
    'ai'
  );
});

// 視光科學數據面板
const IRIS_REAL_MM = 11.5; // 成人平均虹膜直徑 mm，作為比例尺

const opticsPanel  = document.getElementById('optics-panel')!;
const btnOptics    = document.getElementById('btn-optics')!;
const opticsClose  = document.getElementById('optics-close')!;

btnOptics.addEventListener('click', () => opticsPanel.classList.toggle('hidden'));
opticsClose.addEventListener('click', () => opticsPanel.classList.add('hidden'));

function updateOpticsPanel(result: FaceResult) {
  if (!result.detected) return;
  const { leftEye, rightEye, noseBridge } = result;

  // 用虹膜直徑當比例尺：px → mm
  const avgIrisRadiusPx = (leftEye.irisRadius + rightEye.irisRadius) / 2;
  const scale = IRIS_REAL_MM / (avgIrisRadiusPx * 2); // mm/px

  const eyeDistPx = Math.abs(rightEye.irisCenter.x - leftEye.irisCenter.x);
  const pd = (eyeDistPx * scale).toFixed(1);

  // 單眼瞳距：各眼到鼻中線距離
  const noseX = noseBridge?.x ?? (leftEye.irisCenter.x + rightEye.irisCenter.x) / 2;
  const pdLeft  = (Math.abs(noseX - leftEye.irisCenter.x)  * scale).toFixed(1);
  const pdRight = (Math.abs(rightEye.irisCenter.x - noseX) * scale).toFixed(1);

  // 虹膜直徑
  const irisL = (leftEye.irisRadius  * 2 * scale).toFixed(1);
  const irisR = (rightEye.irisRadius * 2 * scale).toFixed(1);

  // 眼高差
  const heightDiffMm = (Math.abs(leftEye.irisCenter.y - rightEye.irisCenter.y) * scale).toFixed(1);

  // 傾斜角
  const tiltDeg = (Math.atan2(
    rightEye.irisCenter.y - leftEye.irisCenter.y,
    rightEye.irisCenter.x - leftEye.irisCenter.x,
  ) * (180 / Math.PI)).toFixed(1);

  // 建議鏡框寬（眼距 × 2.8 scale，換算 mm）
  const frameWidthMm = (eyeDistPx * 2.8 * scale).toFixed(0);

  document.getElementById('optics-pd')!.textContent          = `${pd} mm`;
  document.getElementById('optics-pd-left')!.textContent     = `${pdLeft} mm`;
  document.getElementById('optics-pd-right')!.textContent    = `${pdRight} mm`;
  document.getElementById('optics-iris-l')!.textContent      = `${irisL} mm`;
  document.getElementById('optics-iris-r')!.textContent      = `${irisR} mm`;
  document.getElementById('optics-height-diff')!.textContent = `${heightDiffMm} mm`;
  document.getElementById('optics-tilt')!.textContent        = `${tiltDeg}°`;
  document.getElementById('optics-frame-width')!.textContent = `${frameWidthMm} mm`;
}

// 教學面板 Tab 切換
document.querySelectorAll('.edu-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = (tab as HTMLElement).dataset.tab!;
    document.querySelectorAll('.edu-tab').forEach(t => {
      t.classList.remove('active');
      (t as HTMLElement).style.color = '';
    });
    tab.classList.add('active');
    document.querySelectorAll('.edu-tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${target}`)?.classList.remove('hidden');
  });
});

// 臉型卡片點擊 → 套用眼鏡
document.querySelectorAll('.face-shape-card').forEach((card) => {
  card.addEventListener('click', () => {
    const glassesStyle = (card as HTMLElement).dataset.glasses!;
    const label        = (card as HTMLElement).dataset.label!;

    document.querySelectorAll('.face-shape-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    // 移除舊的 apply btn，加新的
    card.querySelector('.apply-btn')?.remove();
    const btn = document.createElement('span');
    btn.className = 'apply-btn';
    btn.textContent = `套用 ${label}`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderer.setMode('glasses');
      renderer.setGlassesStyle(glassesStyle);
      document.querySelectorAll('.glasses-btn').forEach(b => b.classList.remove('active'));
      document.querySelector(`.glasses-btn[data-glasses="${glassesStyle}"]`)?.classList.add('active');
      modeGlasses.click();
    });
    card.querySelector('.flex-1')?.appendChild(btn);
  });
});

// 臉型推薦
const FACE_SHAPE_RULES: Record<string, { glasses: string; label: string; reason: string }> = {
  round:   { glasses: 'black',      label: '黑框方形',  reason: '方框增加臉部線條感，平衡圓潤輪廓' },
  square:  { glasses: 'tortoise',   label: '玳瑁圓框',  reason: '圓弧線條軟化方形輪廓，增添自然感' },
  oblong:  { glasses: 'gold',       label: '金屬大框',  reason: '大框增加橫向寬度，縮短臉部視覺比例' },
  heart:   { glasses: 'gold',       label: '金屬細框',  reason: '輕巧細框平衡額頭，不搶走視覺重心' },
  oval:    { glasses: 'black',      label: '任何框型',  reason: '鵝蛋臉比例均衡，各種框型都適合' },
};

const btnFaceShape = document.getElementById('btn-face-shape')!;
const faceShapeModal = document.getElementById('face-shape-modal')!;
const faceShapeClose = document.getElementById('face-shape-close')!;
const faceShapeBackdrop = document.getElementById('face-shape-backdrop')!;
const faceShapeResult = document.getElementById('face-shape-result')!;

document.querySelectorAll('.face-shape-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const shape = (btn as HTMLElement).dataset.shape!;
    const rule = FACE_SHAPE_RULES[shape];
    document.querySelectorAll('.face-shape-btn').forEach(b => b.classList.remove('ring-2', 'ring-indigo-400'));
    btn.classList.add('ring-2', 'ring-indigo-400');

    faceShapeResult.innerHTML = `
      <div class="bg-indigo-600/20 border border-indigo-500/40 rounded-xl p-4 text-sm">
        <div class="font-semibold text-white mb-1">推薦款式：${rule.label}</div>
        <div class="text-white/70 text-xs mb-3">${rule.reason}</div>
        <button id="apply-face-rec" data-glasses="${rule.glasses}"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-medium transition w-full">
          套用此款式
        </button>
      </div>`;

    document.getElementById('apply-face-rec')?.addEventListener('click', () => {
      renderer.setMode('glasses');
      renderer.setGlassesStyle(rule.glasses);
      // 同步 UI 狀態
      document.querySelectorAll('.glasses-btn').forEach(b => b.classList.remove('active'));
      document.querySelector(`.glasses-btn[data-glasses="${rule.glasses}"]`)?.classList.add('active');
      modeGlasses.click();
      faceShapeModal.classList.add('hidden');
    });
  });
});

btnFaceShape?.addEventListener('click', () => faceShapeModal.classList.remove('hidden'));
faceShapeClose?.addEventListener('click', () => faceShapeModal.classList.add('hidden'));
faceShapeBackdrop?.addEventListener('click', () => faceShapeModal.classList.add('hidden'));

// 眼鏡圖片上傳（3 角度）
const btnUploadGlasses  = document.getElementById('btn-upload-glasses')!;
const uploadModal       = document.getElementById('upload-glasses-modal')!;
const uploadClose       = document.getElementById('upload-glasses-close')!;
const uploadBackdrop    = document.getElementById('upload-glasses-backdrop')!;

btnUploadGlasses?.addEventListener('click', () => uploadModal.classList.remove('hidden'));
uploadClose?.addEventListener('click',      () => uploadModal.classList.add('hidden'));
uploadBackdrop?.addEventListener('click',   () => uploadModal.classList.add('hidden'));

// 處理每個檔案選擇器
document.querySelectorAll<HTMLInputElement>('.glasses-file-input').forEach((input) => {
  input.addEventListener('change', () => {
    const file    = input.files?.[0];
    const style   = input.dataset.style!;
    const angle   = input.dataset.angle as GlassesAngle;
    const preview = document.getElementById(`preview-${style}-${angle}`) as HTMLImageElement | null;

    if (!file) return;
    const url = URL.createObjectURL(file);
    uploadGlassesImage(style, angle, url);
    if (preview) { preview.src = url; preview.classList.remove('hidden'); }

    // 顯示成功標記
    const label = input.closest('label');
    if (label) label.classList.add('border-green-500/60', 'bg-green-500/10');
  });
});

// Start
init();
