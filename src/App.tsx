import React, { useState } from 'react';
import { AuthProvider, useAuth } from './firebase/authContext';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { UnauthorizedScreen } from './components/UnauthorizedScreen';
import { StudentDashboard } from './components/StudentDashboard';
import { CalendarView } from './components/CalendarView';
import { AttendanceHistoryView } from './components/AttendanceHistoryView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ProfileView } from './components/ProfileView';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import {
  Home,
  Calendar,
  History,
  User,
  QrCode,
  ShieldCheck,
  BookOpen,
  Loader2
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, userRole, loading, isAuthorized, studentStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-600/30 mb-4 animate-bounce">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin mb-2" />
        <h3 className="font-bold text-base text-white">Жүйе жүктелуде...</h3>
        <p className="text-xs text-slate-400 mt-1">Студенттік қатысу PWA</p>
      </div>
    );
  }

  // Not signed in -> Show Google Sign-In Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Signed in with Google, but NOT authorized in student database (or blocked)
  if (!isAuthorized) {
    return <UnauthorizedScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Sticky Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Screen Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          userRole === 'SUPER_ADMIN' ? (
            <AdminPanel />
          ) : userRole === 'TEACHER' ? (
            <TeacherDashboard />
          ) : (
            <StudentDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
          )
        )}

        {activeTab === 'student_view' && (
          <StudentDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'calendar' && (
          <CalendarView onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'history' && (
          <AttendanceHistoryView onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'profile' && (
          <ProfileView onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'teacher_view' && <TeacherDashboard />}

        {activeTab === 'admin_view' && <AdminPanel />}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {/* 1. Басты бет */}
          <button
            id="nav-tab-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
              activeTab === 'home' || activeTab === 'student_view'
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Басты бет</span>
          </button>

          {/* 2. Күнтізбе */}
          <button
            id="nav-tab-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
              activeTab === 'calendar'
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Күнтізбе</span>
          </button>

          {/* 3. Қатысу тарихы (or Teacher/Admin tools) */}
          {userRole === 'STUDENT' ? (
            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'history'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[10px] leading-tight">Қатысу</span>
            </button>
          ) : userRole === 'TEACHER' ? (
            <button
              id="nav-tab-teacher"
              onClick={() => setActiveTab('teacher_view')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'teacher_view' || activeTab === 'home'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] leading-tight">Оқытушы</span>
            </button>
          ) : (
            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab('admin_view')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'admin_view' || activeTab === 'home'
                  ? 'text-purple-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] leading-tight">Әкімші</span>
            </button>
          )}

          {/* 4. Профиль */}
          <button
            id="nav-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
              activeTab === 'profile'
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Профиль</span>
          </button>
        </div>
      </nav>

      {/* PWA Prompt Banner */}
      <InstallPwaPrompt />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
