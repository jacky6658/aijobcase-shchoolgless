
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MaterialManagement from './components/MaterialManagement';
import AIChatView from './components/AIChatView';
import AdminArchitectureDoc from './components/AdminArchitectureDoc';
import CourseList from './components/CourseList';
import UsageView from './components/UsageView';
import LoginView from './components/LoginView';
import SetPasswordView from './components/SetPasswordView';
import AdminUserManagement from './components/AdminUserManagement';
import { UserRole, Tenant, Material, User } from './types';
import { MOCK_TENANTS } from './constants';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTenant, setCurrentTenant] = useState<Tenant>(MOCK_TENANTS[0] as Tenant);

  const [materials, setMaterials] = useState<Material[]>([
    { id: 'm1', courseId: 'c1', tenantId: 't1', title: 'Python 基礎教學大綱', type: 'PDF', url: '#', status: 'READY' },
    { id: 'm2', courseId: 'c1', tenantId: 't1', title: '第二週：流程控制講義', type: 'PPTX', url: '#', status: 'READY' },
  ]);

  // Auth Guard: 若未登入且不是正在登入頁，強制顯示 LoginView
  if (!user) {
    return <LoginView onLoginSuccess={() => setUser(authService.getCurrentUser())} />;
  }

  // Auth Guard: 若是 Google 登入後需設定密碼
  if (user.status === 'PENDING_PASSWORD' && activeTab !== 'set-password') {
    return <SetPasswordView onComplete={() => setUser({ ...user, status: 'ACTIVE' })} />;
  }

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  const handleMockRoleSwitch = async (role: UserRole) => {
    const newUser = await authService.mockLoginAs(role);
    setUser(newUser);
    
    // 智慧導航：如果切換後的角色無權查看當前 Tab，跳轉到 dashboard
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.STUDENT]: ['dashboard', 'courses', 'ai-chat'],
      [UserRole.TEACHER]: ['dashboard', 'courses', 'materials', 'ai-chat', 'usage'],
      [UserRole.TENANT_ADMIN]: ['dashboard', 'materials', 'usage', 'admin-users', 'admin'],
      [UserRole.SUPER_ADMIN]: ['dashboard', 'admin']
    };

    if (!rolePermissions[role].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard role={user.role} tenantName={currentTenant.name} />;
      case 'courses': return <CourseList tenantName={currentTenant.name} />;
      case 'materials': return (
        <MaterialManagement 
          materials={materials.filter(m => m.tenantId === currentTenant.id)} 
          onAdd={(m) => setMaterials(prev => [m, ...prev])} 
          onUpdateStatus={(id, s) => setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: s } : m))} 
        />
      );
      case 'ai-chat': return (
        <AIChatView 
          tenantId={currentTenant.id} 
          courseId="c1" 
          tenantName={currentTenant.name}
        />
      );
      case 'admin': return <AdminArchitectureDoc />;
      case 'admin-users': return <AdminUserManagement />;
      case 'usage': return <UsageView tenantName={currentTenant.name} />; 
      default: return <Dashboard role={user.role} tenantName={currentTenant.name} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 角色與租戶切換工具 - 僅供開發測試 */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-2xl flex flex-col gap-2 min-w-[160px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter px-1">快速角色模擬 (DEV)</p>
          <div className="grid grid-cols-3 gap-1">
            {[UserRole.STUDENT, UserRole.TEACHER, UserRole.TENANT_ADMIN].map(role => (
              <button 
                key={role}
                onClick={() => handleMockRoleSwitch(role)}
                className={`text-[9px] py-1.5 rounded-lg font-black transition-all border ${
                  user.role === role 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'
                }`}
              >
                {role === UserRole.STUDENT ? '學生' : role === UserRole.TEACHER ? '教師' : '管理'}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {MOCK_TENANTS.map(t => (
              <button 
                key={t.id}
                onClick={() => setCurrentTenant(t as Tenant)}
                className={`flex-1 text-[9px] py-1 rounded font-bold transition-all border ${
                  currentTenant.id === t.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}
              >
                {t.name.substring(0, 4)}
              </button>
            ))}
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full mt-1 text-[9px] bg-red-50 text-red-600 py-1.5 rounded-lg font-black border border-red-100 hover:bg-red-100 transition-colors"
          >
            登出當前帳號
          </button>
        </div>
      </div>

      <Sidebar 
        currentRole={user.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tenantName={currentTenant.name}
      />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
