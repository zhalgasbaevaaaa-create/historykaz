import React from 'react';
import { AlertTriangle, UserX, Mail, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../firebase/authContext';

export const UnauthorizedScreen: React.FC = () => {
  const { currentUser, studentStatus, signOut, refreshStudentData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStudentData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const isBlocked = studentStatus === 'Blocked';
  const isInactive = studentStatus === 'Inactive';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 text-center relative z-10">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white mb-6 shadow-xl shadow-rose-600/30">
          {isBlocked ? <ShieldAlert className="w-10 h-10" /> : <UserX className="w-10 h-10" />}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {isBlocked
            ? 'Профиль бұғатталған'
            : isInactive
            ? 'Профиль белсенді емес'
            : 'Сіз студенттер тізімінде жоқсыз.'}
        </h2>

        <p className="text-rose-400 font-semibold text-base mt-2">
          Оқытушыға хабарласыңыз.
        </p>

        <div className="mt-6 bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-left">
          <div className="text-xs text-slate-400 font-medium">Тексерілген Google аккаунт:</div>
          <div className="flex items-center gap-2 mt-1.5 text-slate-200 font-mono text-sm break-all font-semibold">
            <Mail className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{currentUser?.email || '—'}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Рұқсат мәртебесі:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                isBlocked
                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                  : isInactive
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isBlocked ? 'Бұғатталған (Blocked)' : isInactive ? 'Белсенді емес (Inactive)' : 'Тізімде жоқ'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          Сабаққа қатысуды белгілеу үшін тек университет базасында тіркелген және белсенді студенттік Google пошталар ғана пайдаланылады.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            id="refresh-auth-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-sky-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Мәртебені қайта тексеру</span>
          </button>

          <button
            id="signout-unauth-btn"
            onClick={() => signOut()}
            className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm border border-rose-500/40 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Басқа Google аккаунтпен кіру</span>
          </button>
        </div>
      </div>
    </div>
  );
};
