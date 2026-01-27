
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { IconZap, IconCheck } from './Icons';

interface SetPasswordViewProps {
  onComplete: () => void;
}

const SetPasswordView: React.FC<SetPasswordViewProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("密碼不一致");
    if (password.length < 6) return setError("密碼長度需大於 6 位");

    setLoading(true);
    try {
      await authService.setInitialPassword(password);
      onComplete();
    } catch (err: any) {
      setError("設定失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">最後一步</h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">為了安全，請為您的帳號設定一個密碼，未來可直接登入。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">新密碼</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
              placeholder="請輸入新密碼"
              required
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">確認密碼</label>
            <input 
              type="password" 
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
              placeholder="再次輸入密碼"
              required
            />
          </div>
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all"
          >
            {loading ? "處理中..." : "完成設定並開始使用"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordView;
