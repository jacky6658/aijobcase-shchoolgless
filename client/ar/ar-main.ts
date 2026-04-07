/**
 * ar-main.ts - Main AR application entry point
 * Orchestrates face detection, lens rendering, guidance, chat, and session recording
 */

import { initFaceDetector, type FaceResult } from './modules/face-detector';
import { LensRenderer, type LensColor } from './modules/lens-renderer';
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

// Face detection callback
let debugCount = 0;
function onFaceResult(result: FaceResult) {
  if (!result.detected) {
    noFaceMsg.classList.remove('hidden');
    renderer.clear();
    return;
  }
  noFaceMsg.classList.add('hidden');

  // Debug: log first few detections
  if (debugCount < 3) {
    debugCount++;
    console.log('Face detected!', {
      leftIris: result.leftEye?.irisCenter,
      rightIris: result.rightEye?.irisCenter,
      leftRadius: result.leftEye?.irisRadius,
      canvasSize: `${canvas.width}x${canvas.height}`,
    });
  }

  renderer.render(result.leftEye, result.rightEye);

  // Update guidance with eye aperture
  if (sessionActive && !sessionPaused) {
    const avgAperture = (result.leftEye.aperture + result.rightEye.aperture) / 2;
    guidance.updateEyeState(avgAperture);
  }
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

// Start
init();
