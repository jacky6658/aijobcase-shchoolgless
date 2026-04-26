
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MaterialManagement from './components/MaterialManagement';
import AIChatView from './components/AIChatView';
import AdminArchitectureDoc from './components/AdminArchitectureDoc';
import CourseList from './components/CourseList';
import UsageView from './components/UsageView';
import LoginView from './components/LoginView';
import AdminUserManagement from './components/AdminUserManagement';
import ARPracticeReport from './components/ARPracticeReport';
import GlassesManagement from './components/GlassesManagement';
import FaceShapeRecommendation from './components/FaceShapeRecommendation';
import { UserRole, User } from './types';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  if (!user) {
    return <LoginView onLoginSuccess={() => {
      const loggedInUser = authService.getCurrentUser();
      setUser(loggedInUser);
      // Students go directly to AR practice page
      if (loggedInUser?.role === UserRole.STUDENT) {
        window.location.href = '/ar/index.html';
      }
    }} />;
  }

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard role={user.role} />;
      case 'courses': return (
        <CourseList
          userRole={user.role}
          onSelectCourse={(id) => { setSelectedCourseId(id); setActiveTab('ai-chat'); }}
        />
      );
      case 'materials': return (
        <MaterialManagement courseId={selectedCourseId} />
      );
      case 'ai-chat': return (
        <AIChatView courseId={selectedCourseId || ''} />
      );
      case 'ar-report': return <ARPracticeReport />;
      case 'glasses-mgmt': return <GlassesManagement />;
      case 'face-recommend': return (
        <FaceShapeRecommendation
          onSelectItem={(item) => {
            if (item) window.open('/ar/index.html', '_blank');
          }}
        />
      );
      case 'exams': return (
        <div className="text-center py-20 text-slate-400">
          <h2 className="text-2xl font-bold mb-2">測驗系統</h2>
          <p>即將推出 — AI 自動出題 + 互動測驗</p>
        </div>
      );
      case 'admin': return <AdminArchitectureDoc />;
      case 'admin-users': return <AdminUserManagement />;
      case 'usage': return <UsageView />;
      default: return <Dashboard role={user.role} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        currentRole={user.role}
        userName={user.name}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold border border-red-100 hover:bg-red-100 transition-colors"
            >
              登出
            </button>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
