
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { UserRole } from '../types';
import { 
  IconGraduation, 
  IconUser, 
  IconZap, 
  IconDatabase, 
  IconBook, 
  IconQuestion, 
  IconChart, 
  IconTarget,
  IconChat,
  IconInfo,
  IconDashboard,
  IconCheck
} from './Icons';
interface DashboardProps {
  role: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {

  const usageData = [
    { name: '週一', queries: 400, activeUsers: 120 },
    { name: '週二', queries: 820, activeUsers: 150 },
    { name: '週三', queries: 1450, activeUsers: 210 },
    { name: '週四', queries: 1900, activeUsers: 280 },
    { name: '週五', queries: 2400, activeUsers: 350 },
    { name: '週六', queries: 800, activeUsers: 90 },
    { name: '週日', queries: 350, activeUsers: 45 },
  ];

  const studentEngagement = [
    { name: '教材閱讀', value: 85, color: '#6366f1' },
    { name: 'AI 發問', value: 62, color: '#8b5cf6' },
    { name: '測驗完成', value: 45, color: '#ec4899' },
  ];

  const renderAdminStats = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: '總課程數', value: '--', Icon: IconGraduation, color: 'bg-blue-500' },
          { label: '活躍學生數', value: '--', Icon: IconUser, color: 'bg-green-500' },
          { label: 'AI 總請求', value: '--', Icon: IconZap, color: 'bg-purple-500' },
          { label: '教材數量', value: '--', Icon: IconDatabase, color: 'bg-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}>
              <stat.Icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <IconChart className="w-5 h-5 text-indigo-600" />
            使用趨勢 (最近 7 日)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="queries" name="AI 問答數" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <IconZap className="w-5 h-5 text-indigo-600" />
            方案配額監控
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold">
                <span className="text-slate-600">AI 運算配額</span>
                <span className="text-indigo-600">--</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-1000 bg-indigo-600" style={{ width: '0%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">連接後端後顯示真實數據</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                <IconInfo className="w-3 h-3" /> 系統狀態建議
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                偵測到本週發問量暴增 45%，建議將配額提升至 <strong>PRO</strong> 以免影響教學品質。
              </p>
              <button className="w-full mt-3 bg-white border border-indigo-200 text-indigo-600 font-bold py-2 rounded-lg text-xs hover:bg-indigo-50 transition-colors shadow-sm">
                查看升級選項
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeacherStats = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl"><IconBook className="w-8 h-8" /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">我的課程教材</p>
            <h3 className="text-xl font-bold text-slate-800">12 份</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><IconChat className="w-8 h-8" /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">學生累計發問</p>
            <h3 className="text-xl font-bold text-slate-800">1,248 次</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl"><IconTarget className="w-8 h-8" /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">教材覆蓋率</p>
            <h3 className="text-xl font-bold text-slate-800">92%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <IconChart className="w-5 h-5 text-indigo-600" />
            學生學習參與度
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentEngagement} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                  {studentEngagement.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <IconQuestion className="w-5 h-5 text-indigo-600" />
            熱門發問主題
          </h3>
          <div className="space-y-3">
            {[
              { topic: 'RAG 與 Fine-tuning 的區別', count: 142 },
              { topic: 'Chunking 策略如何優化', count: 98 },
              { topic: 'Gemini API 安全性', count: 76 },
              { topic: '向量資料庫選擇', count: 54 },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-medium text-slate-700">{t.topic}</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">{t.count} 次</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentStats = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl">
        <h3 className="text-2xl font-bold">歡迎回來，陳同學！</h3>
        <p className="text-indigo-100 mt-2">您本週透過 AI 教材助理節省了約 4 小時的檢索時間。</p>
        <div className="flex gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest">本月發問</p>
            <p className="text-2xl font-black mt-1">48</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest">學習進度</p>
            <p className="text-2xl font-black mt-1">72%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <IconCheck className="w-5 h-5 text-indigo-600" />
            最近複習教材
          </h3>
          <div className="space-y-4">
            {[
              { title: 'Python 流程控制講義', date: '2 小時前' },
              { title: '資料結構重點整理', date: '昨天' },
              { title: 'RAG 核心技術概論', date: '3 天前' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="bg-slate-100 p-2 rounded-lg"><IconBook className="w-4 h-4 text-slate-400" /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{item.date}</p>
                </div>
                <button className="text-xs text-indigo-600 font-bold">開啟</button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <IconZap className="w-5 h-5 text-indigo-600" />
            AI 學習建議
          </h3>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <p className="text-xs text-indigo-800 leading-relaxed font-medium">
              基於您最近對 <strong>「向量檢索」</strong> 的發問，建議閱讀教材第 3 章第 2 節，那裡有更深入的演算法說明。
            </p>
            <button className="mt-3 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-md shadow-indigo-100">前往閱讀</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {role === UserRole.ADMIN ? '系統管理面板' : role === UserRole.TEACHER ? '教學工作台' : '學習儀表板'}
          </h2>
          <p className="text-slate-400 text-xs font-medium mt-1">
            EduMind AI 課程複習助教
          </p>
        </div>
        <div className="flex gap-2">
           <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 shadow-sm flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
             AI 系統在線
           </div>
        </div>
      </header>

      {role === UserRole.ADMIN ? renderAdminStats() : 
       role === UserRole.TEACHER ? renderTeacherStats() : renderStudentStats()}
    </div>
  );
};

export default Dashboard;
