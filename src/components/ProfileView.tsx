import React from 'react';
import {
  User,
  Mail,
  Users,
  ShieldCheck,
  Award,
  Smartphone,
  LogOut,
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';

interface ProfileViewProps {
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const { currentUser, currentStudent, userRole, signOut } = useAuth();

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            АРТҚА
          </button>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">Профиль</h2>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-5 space-y-5">
        {/* Student Digital ID Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 border border-sky-500/40 rounded-3xl p-6 shadow-2xl shadow-sky-950/60 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Student"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-400/60 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-sky-900 text-sky-300 flex items-center justify-center font-bold text-2xl border-2 border-sky-500/40">
                  {(currentStudent?.fullName || 'С')[0]}
                </div>
              )}
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                  {currentStudent?.fullName || currentUser?.displayName || 'Студент'}
                </h3>
                <div className="text-xs font-mono text-sky-400 mt-0.5">
                  ID: {currentStudent?.studentId || 'ST-2026-001'}
                </div>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {currentStudent?.status === 'Active' ? 'Белсенді студент' : 'Мәртебесі белсенді'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Академиялық топ:</span>
              <span className="font-bold text-slate-100 font-mono text-sm">HC-2026-2027</span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Рөлі:</span>
              <span className="font-bold text-sky-400 text-sm">
                {userRole === 'SUPER_ADMIN' ? 'Бас Әкімші' : userRole === 'TEACHER' ? 'Оқытушы' : 'Студент'}
              </span>
            </div>
          </div>
        </div>

        {/* Verified Account Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-3 text-xs">
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Байланыстырылған деректер
          </h4>

          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-400" />
              <span className="text-slate-300">Google Email:</span>
            </div>
            <span className="font-mono text-slate-100 font-semibold">{currentUser?.email}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">PWA Қосымша режимі:</span>
            </div>
            <span className={`font-bold ${isStandalone ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isStandalone ? 'Орнатылған (Standalone)' : 'Браузер режимі'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300">Firebase Қауіпсіздігі:</span>
            </div>
            <span className="font-bold text-emerald-400">Қорғалған (RBAC Active)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          АРТҚА — басты мәзір
        </button>

        {/* Sign Out Button */}
        <button
          id="profile-signout-btn"
          onClick={() => signOut()}
          className="w-full bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/60 text-rose-300 font-extrabold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Аккаунттан шығу (Sign Out)</span>
        </button>
      </div>
    </div>
  );
};
