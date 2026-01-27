
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { IconZap, IconUser } from './Icons';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // 模擬重導向與回調
      const { needsPasswordSetup } = await authService.googleCallback("mock_code");
      onLoginSuccess();
    } catch (err: any) {
      setError("Google 登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-100">
            <IconZap className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">EduMind AI 登入</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">智慧教材問答 SaaS 平台</p>
        </div>

        <div className="p-8 space-y-6">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            使用 Google 帳號登入
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">或使用 Email</span></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@ntu.edu.tw"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">密碼</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? "登入中..." : "立即登入"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
