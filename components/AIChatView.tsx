
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';
import { vectorService } from '../services/vectorService';
import { IconChat, IconMic, IconSend, IconZap, IconInfo } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface AIChatViewProps {
  tenantId: string;
  courseId: string;
  tenantName: string;
}

const AIChatView: React.FC<AIChatViewProps> = ({ tenantId, courseId, tenantName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', content: `你好！我是來自 **${tenantName}** 的課程助理。\n\n我已準備好為您檢索本課程的專屬教材內容。您可以試著問我：\n\n* **什麼是 RAG？**\n* **為什麼需要進行 Chunking？**`, timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const hasTriggeredAutoSend = useRef<boolean>(false);

  // Markdown 解析：處理粗體、斜體、標題、條列式
  const formatMarkdown = (text: string) => {
    if (!text) return null;
    let processed = text.replace(/```[\s\S]*?```/g, '').trim();
    return processed.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-slate-900 mt-3 mb-1 leading-tight">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-slate-900 mt-4 mb-2 border-b border-slate-100 pb-1 leading-tight">{line.replace('## ', '')}</h2>;
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
    setMessages([{ 
      id: '1', 
      role: 'model', 
      content: `您好，目前正在為您服務的是 **${tenantName}** 專屬 AI。\n\n您可以詢問任何關於本課程已上傳教材的問題。`, 
      timestamp: new Date().toISOString() 
    }]);
  }, [tenantId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const refineSpeechIntent = async (rawText: string) => {
    if (!rawText || rawText.trim().length < 2) return rawText;
    setIsRefining(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `將以下語音轉錄內容轉換為一個正式的「教學詢問句」。
        去除冗詞（如呃、那個、我想問）、修正辨識錯誤。
        如果是「送出」或「發送」等指令詞請直接剔除。
        只回傳精煉後的文字。
        語音內容：\"${rawText}\"`,
      });
      return response.text.trim() || rawText;
    } catch (e) {
      console.error("Refinement error:", e);
      return rawText;
    } finally {
      setIsRefining(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援語音辨識功能。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = '';
    hasTriggeredAutoSend.current = false;

    recognition.onstart = () => {
      setIsListening(true);
      setInput(""); 
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
        
        const fullCurrentText = finalTranscript + interimTranscript;
        // 強化偵測：一旦發現「送出」指令
        if ((fullCurrentText.includes("送出") || fullCurrentText.includes("發送")) && !hasTriggeredAutoSend.current) {
          hasTriggeredAutoSend.current = true;
          const cleanText = fullCurrentText.replace(/送出|發送/g, "").trim();
          recognition.stop();
          // 強制執行：直接進入處理流程
          processFinalVoiceInput(cleanText, true);
          return;
        }
      }
      setInput(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      // 如果不是指令觸發停止且有內容，則一般處理
      if (!hasTriggeredAutoSend.current && finalTranscript.trim()) {
        processFinalVoiceInput(finalTranscript, false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processFinalVoiceInput = async (text: string, autoSend: boolean) => {
    if (!text.trim()) return;
    
    // 語意精煉
    const refinedText = await refineSpeechIntent(text);
    const finalText = refinedText || text;
    
    setInput(finalText);
    
    // 如果是自動送出，跳過狀態同步直接觸發
    if (autoSend) {
      triggerChat(finalText);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isListening || isRefining) return;
    triggerChat(input);
  };

  const triggerChat = async (query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const searchResults = await vectorService.similaritySearch(query, tenantId, courseId);
      const context = searchResults.map(r => r.content).join('\n\n');
      const sources = searchResults.map(r => ({ ...r.metadata, similarity: r.similarity }));

      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'model', content: '', timestamp: new Date().toISOString() }]);

      let streamContent = "";
      const stream = geminiService.chatStream(query, context, tenantId);
      for await (const chunk of stream) {
        streamContent += chunk;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: streamContent, sources: sources } : m));
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <IconChat className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-700">SaaS RAG 智慧助理</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase tracking-tight">
            租戶 ID: {tenantId}
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">{tenantName}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm transition-all ${
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
                    <IconInfo className="w-3 h-3" /> 參考資料路徑：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(m as any).sources.map((s: any, sIdx: number) => (
                      <span key={sIdx} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        {s.title} ({Math.round(s.similarity * 100)}%)
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
        {(isListening || isRefining) && (
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex gap-1 h-4 items-end">
              {[0.5, 0.8, 0.4, 0.9, 0.6].map((h, i) => (
                <div key={i} className={`w-1 bg-indigo-500 rounded-full ${isListening ? 'animate-[pulse_1s_infinite]' : 'animate-bounce'}`} style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
            <span className="text-xs font-bold text-indigo-600 animate-pulse">
              {isListening ? "聆聽中... 說「送出」自動發送" : "正在語意重組與理解..."}
            </span>
          </div>
        )}
        
        <div className="flex gap-2 items-center">
          <button 
            onClick={toggleMic}
            disabled={isTyping || isRefining}
            className={`p-3 rounded-full transition-all flex-shrink-0 ${
              isListening ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110 ring-4 ring-red-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <IconMic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "" : (isRefining ? "正在處理..." : `詢問 ${tenantName} 的內容...`)}
              className={`w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ${
                isListening ? 'bg-indigo-50/50 border-indigo-200' : ''
              } ${isRefining ? 'opacity-50 cursor-wait' : ''}`}
              disabled={isTyping || isListening || isRefining}
            />
          </div>

          <button
            onClick={handleSend}
            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50 flex-shrink-0 shadow-lg shadow-indigo-100"
            disabled={!input.trim() || isTyping || isListening || isRefining}
          >
            <IconSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
