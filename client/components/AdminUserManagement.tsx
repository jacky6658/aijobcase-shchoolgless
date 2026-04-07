
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { IconUser, IconZap, IconInfo } from './Icons';
import { getAuthHeaders } from '../services/authService';

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/users', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setUsers(d.data); })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">用戶管理</h2>
        <p className="text-sm text-slate-500">管理系統用戶帳號</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">使用者</th>
              <th className="px-6 py-4">學號</th>
              <th className="px-6 py-4">角色</th>
              <th className="px-6 py-4">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><IconUser className="w-4 h-4 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-700">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.student_id}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
                    u.role === 'TEACHER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>{u.status}</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">連接後端後顯示用戶列表</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManagement;
