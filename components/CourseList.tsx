
import React from 'react';
import { IconBook, IconUser, IconZap, IconGraduation } from './Icons';

interface CourseListProps {
  tenantName: string;
}

const CourseList: React.FC<CourseListProps> = ({ tenantName }) => {
  const mockCourses = [
    { id: 'c1', name: '深度學習與 RAG 實務', teacher: '陳大文 教授', students: 128, progress: 75, lastActivity: '2 小時前' },
    { id: 'c2', name: 'Python 程式設計 (一)', teacher: '林小明 老師', students: 256, progress: 30, lastActivity: '昨天' },
    { id: 'c3', name: '資料結構與演算法', teacher: '張三 博士', students: 84, progress: 95, lastActivity: '3 天前' },
    { id: 'c4', name: '分散式系統導論', teacher: '李四 老師', students: 42, progress: 0, lastActivity: '尚未開始' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">我的課程</h2>
          <p className="text-sm text-slate-500 font-medium">在 {tenantName} 參與的教學空間</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <IconGraduation className="w-4 h-4" /> 加入新課程
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {mockCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6 group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <IconBook className="w-6 h-6" />
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-black uppercase">
                AI Assistant Active
              </span>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-1">{course.name}</h3>
            <p className="text-sm text-slate-400 font-medium mb-6 flex items-center gap-2">
              <IconUser className="w-4 h-4" /> {course.teacher}
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className="text-slate-500 uppercase tracking-tighter">學習進度</span>
                  <span className="text-indigo-600">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                    +{course.students}
                  </div>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                  <IconZap className="w-4 h-4" /> 進入 AI 教室
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList;
