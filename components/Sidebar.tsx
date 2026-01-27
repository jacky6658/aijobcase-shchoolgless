
import React from 'react';
import { UserRole } from '../types';
import { 
  IconDashboard, 
  IconBook, 
  IconFile, 
  IconChat, 
  IconZap, 
  IconSettings,
  IconUser
} from './Icons';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenantName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRole, activeTab, setActiveTab, tenantName }) => {
  const menuItems = [
    { id: 'dashboard', label: '數據儀表板', Icon: IconDashboard, roles: [UserRole.TENANT_ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
    { id: 'courses', label: '我的課程', Icon: IconBook, roles: [UserRole.TEACHER, UserRole.STUDENT] },
    { id: 'materials', label: '教材管理', Icon: IconFile, roles: [UserRole.TEACHER, UserRole.TENANT_ADMIN] },
    { id: 'ai-chat', label: 'AI 課業問答', Icon: IconChat, roles: [UserRole.TEACHER, UserRole.STUDENT] },
    { id: 'usage', label: '使用量與配額', Icon: IconZap, roles: [UserRole.TENANT_ADMIN, UserRole.TEACHER] },
    { id: 'admin-users', label: '用戶管理', Icon: IconUser, roles: [UserRole.TENANT_ADMIN] },
    { id: 'admin', label: '系統架構', Icon: IconSettings, roles: [UserRole.TENANT_ADMIN] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="w-64 bg-slate-900 h-screen text-white flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6">
        <h1 className="text-xl font-bold text-indigo-400">EduMind AI</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{tenantName}</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {filteredMenu.map((item) => {
          const ActiveIcon = item.Icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ActiveIcon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold shadow-inner">
            <span className="text-xs">U</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">當前用戶</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
              {currentRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
