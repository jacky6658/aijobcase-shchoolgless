
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { IconUser, IconTrash, IconZap, IconInfo } from './Icons';
import { authService } from '../services/authService';

const AdminUserManagement: React.FC = () => {
  const [adminToken, setAdminToken] = useState('');
  const [users] = useState<User[]>([
    { id: 'u1', email: 'alex@ntu.edu.tw', name: '陳大文', role: UserRole.STUDENT, status: 'ACTIVE', tenantId: 't1', lastLoginAt: '2024-03-20' },
    { id: 'u2', email: 'bob@ntu.edu.tw', name: '王小明', role: UserRole.STUDENT, status: 'PENDING_PASSWORD', tenantId: 't1' },
  ]);
  const [tempPassword, setTempPassword] = useState<{id: string, pw: string} | null>(null);

  const handleReset = async (userId: string) => {
    try {
      const pw = await authService.adminResetPassword(userId, adminToken);
      setTempPassword({ id: userId, pw });
    } catch (e) {
      alert("管理員 Token 無效或權限不足");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">用戶權限管理</h2>
          <p className="text-sm text-slate-500 font-medium">監控學生狀態與重設存取權限</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">Admin Secret Token</label>
          <input 
            type="password" 
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none"
            placeholder="輸入管理金鑰"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">使用者</th>
              <th className="px-6 py-4">Email / ID</th>
              <th className="px-6 py-4">狀態</th>
              <th className="px-6 py-4">最後登入</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><IconUser className="w-4 h-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-700">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] text-slate-400 font-medium">{u.lastLoginAt || '從未登入'}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleReset(u.id)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    重設密碼
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tempPassword && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <IconZap className="text-amber-500 w-5 h-5" />
            <p className="text-sm font-medium text-amber-800">
              已產生臨時密碼：<span className="font-mono font-black bg-white px-2 py-0.5 rounded border border-amber-200">{tempPassword.pw}</span>
            </p>
          </div>
          <button onClick={() => setTempPassword(null)} className="text-xs font-bold text-amber-600 uppercase">關閉</button>
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 flex gap-4">
        <IconInfo className="w-6 h-6 text-slate-300 shrink-0" />
        <div className="text-xs text-slate-500 leading-relaxed">
          <p className="font-bold text-slate-600 mb-1">關於安全策略</p>
          <li>Admin 無法查看使用者原密碼。</li>
          <li>重設密碼後，系統會自動將使用者狀態改為 PENDING_PASSWORD，強制其下次登入後更新。</li>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
