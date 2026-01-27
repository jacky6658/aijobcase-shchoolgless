
import React from 'react';
import { IconZap, IconDatabase, IconChart, IconInfo, IconCheck } from './Icons';
import { MOCK_TENANTS } from '../constants';

interface UsageViewProps {
  tenantName: string;
}

const UsageView: React.FC<UsageViewProps> = ({ tenantName }) => {
  const tenant = MOCK_TENANTS.find(t => t.name === tenantName) || MOCK_TENANTS[0];
  const quotaPercentage = Math.round((tenant.quotaUsed / tenant.quotaLimit) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">使用量與配額</h2>
        <p className="text-sm text-slate-500 font-medium">管理您的租戶方案與資源限額</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><IconChart className="w-5 h-5" /></div>
            <h3 className="font-black text-slate-800">當前資源消耗</h3>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">AI 運算額度 (本月)</p>
                  <p className="text-2xl font-black text-slate-800">{tenant.quotaUsed.toLocaleString()} <span className="text-sm text-slate-300">/ {tenant.quotaLimit.toLocaleString()} 次</span></p>
                </div>
                <span className="text-sm font-black text-indigo-600">{quotaPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${quotaPercentage}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  <IconDatabase className="w-4 h-4" /> 向量儲存空間
                </div>
                <p className="text-lg font-black text-slate-800">425 MB <span className="text-xs text-slate-300">/ 2 GB</span></p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-500 h-full rounded-full w-[21%]"></div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  <IconZap className="w-4 h-4" /> 教材處理次數
                </div>
                <p className="text-lg font-black text-slate-800">12 份 <span className="text-xs text-slate-300">/ 無限制</span></p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                  <div className="bg-blue-500 h-full rounded-full w-[5%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/30 shadow-inner">
              <IconZap className="w-6 h-6" />
            </div>
            <p className="text-indigo-100 text-xs font-black uppercase tracking-widest">當前方案</p>
            <h3 className="text-3xl font-black mt-2">{tenant.plan.replace('_', ' ')}</h3>
            <div className="mt-6 space-y-3">
              {['支援多租戶隔離', 'Gemini Flash 3 整合', '向量 RAG 檢索', '優先技術支援'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm font-medium text-indigo-50">
                  <IconCheck className="w-4 h-4 text-indigo-300" /> {f}
                </div>
              ))}
            </div>
          </div>
          <button className="mt-8 bg-white text-indigo-600 w-full py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-50 transition-all">
            升級方案
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4 items-start">
        <IconInfo className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <h4 className="text-sm font-black text-amber-900">配額提醒</h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            您的租戶目前處於 <strong>{tenant.plan}</strong> 測試期。若 AI 請求次數超過 {tenant.quotaLimit} 次，系統將會暫停 API 回應。如有擴展需求請聯繫銷售代表。
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsageView;
