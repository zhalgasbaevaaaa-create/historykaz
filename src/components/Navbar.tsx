import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  LogOut,
  WifiOff,
  User,
  ShieldCheck,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, currentStudent, userRole, signOut, switchRoleForTesting } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Әкімші (Admin)', bg: 'bg-purple-900/80 text-purple-200 border-purple-600' };
      case 'TEACHER':
        return { label: 'Оқытушы', bg: 'bg-emerald-900/80 text-emerald-200 border-emerald-600' };
      case 'STUDENT':
      default:
        return { label: 'Студент', bg: 'bg-sky-900/80 text-sky-200 border-sky-600' };
    }
  };

  const badge = getRoleBadge(userRole);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Интернет байланысы жоқ. Офлайн режимде жұмыс істеуде.</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setActiveTab && setActiveTab('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-100 leading-tight">
              Студенттік қатысу
            </h1>
            <p className="text-[11px] text-sky-400 font-medium">PWA Attendance System</p>
          </div>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role switcher for Admin test verification */}
          {(userRole === 'SUPER_ADMIN' || currentUser?.email === 'akonyaalex@gmail.com') && (
            <div className="relative">
              <button
                id="role-switch-dropdown-btn"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
              >
                <span>{badge.label}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 z-50 text-xs">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Рөлді ауыстыру (Тестілеу):
                  </div>
                  <button
                    onClick={() => {
                      switchRoleForTesting('STUDENT');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                      userRole === 'STUDENT' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Студент көрінісі</span>
                  </button>
                  <button
                    onClick={() => {
                      switchRoleForTesting('TEACHER');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                      userRole === 'TEACHER' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Оқытушы көрінісі</span>
                  </button>
                  <button
                    onClick={() => {
                      switchRoleForTesting('SUPER_ADMIN');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
                      userRole === 'SUPER_ADMIN' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Бас Әкімші (Admin)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="User"
                className="w-7 h-7 rounded-lg object-cover border border-sky-400/40"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-600/40 flex items-center justify-center text-sky-400 font-bold text-xs">
                {(currentStudent?.fullName || currentUser?.displayName || 'С')[0]}
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-100 max-w-[120px] truncate leading-none">
                {currentStudent?.fullName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Студент'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5">
                {currentStudent?.group || badge.label}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            id="navbar-signout-btn"
            onClick={() => signOut()}
            title="Аккаунттан шығу"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition cursor-pointer"
            aria-label="Аккаунттан шығу"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
