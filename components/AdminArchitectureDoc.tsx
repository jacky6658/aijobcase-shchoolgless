
import React from 'react';
import { SYSTEM_ARCH_DOC } from '../constants';

const AdminArchitectureDoc: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <header className="bg-slate-900 text-white p-8 rounded-2xl">
        <h2 className="text-3xl font-bold">系統架構藍圖 (System Blueprint)</h2>
        <p className="text-slate-400 mt-2">EduMind AI 多租戶 SaaS 平台技術底座</p>
      </header>

      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-indigo-600 pl-4">1. 資料庫 Schema (支援多租戶)</h3>
        <pre className="bg-slate-800 text-indigo-300 p-6 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed">
          {SYSTEM_ARCH_DOC.db_schema}
        </pre>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-indigo-600 pl-4">2. SaaS 核心 vs 學校 MVP</h3>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">功能模組</th>
                  <th className="px-6 py-3 font-semibold">學校 MVP 版</th>
                  <th className="px-6 py-3 font-semibold">SaaS 核心版</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 font-medium">身份驗證</td>
                  <td className="px-6 py-4">手動導入 / SSO</td>
                  <td className="px-6 py-4">自助註冊 / Stripe</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">多租戶架構</td>
                  <td className="px-6 py-4">必須支援</td>
                  <td className="px-6 py-4">原生整合</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">AI RAG</td>
                  <td className="px-6 py-4">Gemini 基礎版</td>
                  <td className="px-6 py-4">企業級自定義模型</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">配額限制</td>
                  <td className="px-6 py-4">軟上限</td>
                  <td className="px-6 py-4">硬上限 / 計費系統</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-indigo-600 pl-4">3. 開發路線圖 (Roadmap)</h3>
          <div className="space-y-4">
            {[
              { step: '第一步：核心基礎', task: '設置 PostgreSQL 與 pgvector，開發租戶中間件與 Gemini API 整合。' },
              { step: '第二步：MVP 功能', task: '實現文件分塊、向量化流水線，為學校試點提供問答介面。' },
              { step: '第三步：SaaS 層級', task: '整合 Stripe 訂閱、按席位計價，並上線產品落地頁。' },
              { step: '第四步：規模化', task: '優化向量搜索 HNSW 索引，並實現進階租戶分析看板。' },
            ].map((r, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">{i+1}</div>
                <div>
                  <h4 className="font-bold text-slate-800">{r.step}</h4>
                  <p className="text-sm text-slate-600">{r.task}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-indigo-600 pl-4">4. 關鍵 API 端點</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_ARCH_DOC.api_list.map((api, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-xs text-indigo-700">
              {api}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminArchitectureDoc;
