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
  const { currentUser, currentStudent, userRole, signOut } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const t = setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(t);
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
            <p className="text-[11px] text-sky-400 font-medium font-mono">
              {now.toLocaleDateString('kk-KZ')} • {now.toLocaleTimeString('kk-KZ')}
            </p>
          </div>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role switcher for Admin test verification */}
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
              <div className="text-xs font-bold text-slate-100 max-w-[140px] truncate leading-none">
                {currentStudent?.fullName || currentUser?.displayName || 'Студент'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5">
                {userRole === 'TEACHER' ? badge.label : 'HC-2026-2027'}
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
