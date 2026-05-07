import React, { useState, useRef, useEffect } from 'react';
import { getAuthHeaders } from '../services/authService';
import { IconChat, IconMic, IconSend } from './Icons';

interface Message {
  id: string;
  role: 'user' | 'system';
  content: string;
  source?: { question: string; category: string; similarity: number };
  timestamp: string;
}

interface AIChatViewProps {
  courseId: string;
}

const AIChatView: React.FC<AIChatViewProps> = ({ courseId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1', role: 'system',
      content: '你好！歡迎使用課業問答系統。\n\n請輸入你的問題，系統會從知識庫中找到最相關的解答。',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, searching]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(), role: 'user', content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSearching(true);

    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ query, course_id: courseId || undefined, top_k: 1 }),
      });
      const data = await res.json();
      const results = data.data ?? [];

      let reply: Message;
      if (results.length > 0) {
        const top = results[0];
        const pct = Math.round(top.similarity * 100);
        reply = {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: top.answer,
          source: { question: top.question, category: top.category, similarity: pct },
          timestamp: new Date().toISOString(),
        };
      } else {
        reply = {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: '目前知識庫中找不到與您問題相關的答案。\n\n建議您聯繫老師，或換個方式重新描述問題。',
          timestamp: new Date().toISOString(),
        };
      }
      setMessages(prev => [...prev, reply]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'system',
        content: '查詢失敗，請稍後再試。',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setSearching(false);
    }
  };

  const toggleMic = () => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('您的瀏覽器不支援語音辨識'); return; }
    const rec = new SR();
    rec.lang = 'zh-TW';
    rec.interimResults = true;
    rec.continuous = true;
    let final = '';
    rec.onstart = () => { setIsListening(true); setInput(''); };
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const full = final + interim;
      if (full.includes('送出') || full.includes('發送')) {
        rec.stop();
        const clean = full.replace(/送出|發送/g, '').trim();
        if (clean) handleSearch(clean);
        return;
      }
      setInput(final || interim);
    };
    rec.onend = () => { setIsListening(false); if (final.trim()) setInput(final); };
    recognitionRef.current = rec;
    rec.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
        <IconChat className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-slate-700">課業問答</h2>
        <span className="ml-auto text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-full">
          知識庫查詢
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-line">{m.content}</p>

              {m.source && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">來源問題</p>
                  <p className="text-xs text-slate-600 italic">「{m.source.question}」</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                      {m.source.category}
                    </span>
                    <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">
                      相似度 {m.source.similarity}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {searching && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.3s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.5s]" />
                <span className="ml-2 text-slate-400 text-xs italic">搜尋知識庫中...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        {isListening && (
          <p className="text-xs font-bold text-indigo-600 animate-pulse text-center mb-3">
            聆聽中... 說「送出」自動發送
          </p>
        )}
        <div className="flex gap-2 items-center">
          <button onClick={toggleMic} disabled={searching}
            className={`p-3 rounded-full transition-all flex-shrink-0 ${
              isListening ? 'bg-red-500 text-white ring-4 ring-red-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            <IconMic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !searching && handleSearch(input)}
            placeholder={isListening ? '' : '輸入你的問題...'}
            disabled={searching || isListening}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={() => handleSearch(input)}
            disabled={!input.trim() || searching || isListening}
            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0 shadow-lg shadow-indigo-100">
            <IconSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
