
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatStream } from '../services/chatService';
import { IconChat, IconMic, IconSend, IconInfo } from './Icons';

interface AIChatViewProps {
  courseId: string;
}

const AIChatView: React.FC<AIChatViewProps> = ({ courseId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', content: '你好！我是你的 AI 課程複習助教。\n\n你可以問我任何關於課程教材的問題，我會根據教材內容為你解答。', timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const formatMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-slate-900 mt-3 mb-1">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-slate-900 mt-4 mb-2 border-b border-slate-100 pb-1">{line.replace('## ', '')}</h2>;
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return <li key={i} className="ml-5 list-disc text-sm my-1 text-slate-700">{renderInline(content)}</li>;
      }
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm leading-relaxed mb-2 text-slate-700">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-indigo-700">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-slate-600">{part.slice(1, -1)}</em>;
      return part;
    });
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const toggleMic = () => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("您的瀏覽器不支援語音辨識"); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.interimResults = true;
    recognition.continuous = true;
    let finalTranscript = '';

    recognition.onstart = () => { setIsListening(true); setInput(''); };
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      const full = finalTranscript + interim;
      if (full.includes('送出') || full.includes('發送')) {
        recognition.stop();
        const clean = full.replace(/送出|發送/g, '').trim();
        if (clean) triggerChat(clean);
        return;
      }
      setInput(finalTranscript || interim);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) setInput(finalTranscript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = () => {
    if (!input.trim() || isTyping || isListening) return;
    triggerChat(input);
  };

  const triggerChat = async (query: string) => {
    if (!query.trim() || !courseId) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: query, timestamp: new Date().toISOString() };
    const aiMsgId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, userMsg, { id: aiMsgId, role: 'model', content: '', timestamp: new Date().toISOString() }]);
    setInput('');
    setIsTyping(true);

    let streamContent = '';
    let sources: any[] = [];

    try {
      for await (const event of chatStream(query, courseId)) {
        switch (event.type) {
          case 'sources':
            sources = event.data || [];
            break;
          case 'token':
            streamContent += event.text || '';
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: streamContent, sources } : m));
            break;
          case 'error':
            streamContent += `\n\n⚠️ ${event.message}`;
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: streamContent } : m));
            break;
          case 'done':
            break;
        }
      }
    } catch (error: any) {
      const errMsg = error.message || '連線失敗';
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: `⚠️ ${errMsg}` } : m));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <IconChat className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-700">AI 課程複習助教</h2>
        </div>
        {!courseId && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">請先選擇課程</span>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              <div className="prose prose-sm max-w-none">
                {m.content ? formatMarkdown(m.content) : (isTyping && m.role === 'model' && idx === messages.length - 1 ? (
                  <div className="flex gap-1 items-center py-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                    <span className="ml-2 text-slate-400 text-xs italic">正在檢索教材...</span>
                  </div>
                ) : null)}
              </div>
              {m.role === 'model' && (m as any).sources?.length > 0 && !isTyping && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <IconInfo className="w-3 h-3" /> 參考教材：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(m as any).sources.map((s: any, sIdx: number) => (
                      <span key={sIdx} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                        {s.metadata?.filename || '教材片段'} ({Math.round((s.similarity || 0) * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t">
        {isListening && (
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-indigo-600 animate-pulse">聆聽中... 說「送出」自動發送</span>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <button onClick={toggleMic} disabled={isTyping}
            className={`p-3 rounded-full transition-all flex-shrink-0 ${
              isListening ? 'bg-red-500 text-white shadow-lg ring-4 ring-red-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            <IconMic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? '' : '輸入你的問題...'}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            disabled={isTyping || isListening} />
          <button onClick={handleSend} disabled={!input.trim() || isTyping || isListening}
            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0 shadow-lg shadow-indigo-100">
            <IconSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
