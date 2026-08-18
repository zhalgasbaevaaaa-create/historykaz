import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  QrCode,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { InstallPwaPrompt } from './InstallPwaPrompt';

export const LoginScreen: React.FC = () => {
  const { signInDemo } = useAuth();
  const [signingIn, setSigningIn] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleDemo = async (role: 'STUDENT' | 'TEACHER' | 'SUPER_ADMIN') => {
    setSigningIn(role);
    setAuthError(null);
    try {
      await signInDemo(role);
    } catch (err: any) {
      setAuthError('Кіру кезінде ақау пайда болды. Қайта көріңіз.');
    } finally {
      setSigningIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden text-slate-100">
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-md mx-auto w-full pt-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-tight">
              Студенттік қатысу
            </span>
            <div className="text-[10px] text-sky-400 font-mono">PWA Attendance Portal</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Қауіпсіз жүйе</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md mx-auto w-full my-auto py-8 z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80 text-center">
          {/* App Big Badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-sky-600/30 mb-6">
            <QrCode className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Сабаққа қатысуды QR арқылы тіркеу
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
            Университет базасындағы ресми студенттік Google аккаунтыңызбен кіріңіз.
          </p>

          {/* Highlights */}
          <div className="my-6 grid grid-cols-2 gap-2.5 text-left">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 font-medium">
                15 минуттық бір реттік QR кодтар
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 font-medium">
                Жеке сабақ кестесі және аудиториялар
              </div>
            </div>
          </div>

          {authError && (
            <div className="mb-4 text-xs text-rose-300 bg-rose-950/50 border border-rose-800 p-3 rounded-xl text-left">
              {authError}
            </div>
          )}

          <div className="space-y-2.5">
            <button
              id="demo-student-btn"
              onClick={() => handleDemo('STUDENT')}
              disabled={!!signingIn}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-sm transition active:scale-95 disabled:opacity-50"
            >
              {signingIn === 'STUDENT' ? <Loader2 className="w-5 h-5 animate-spin text-sky-600" /> : <GraduationCap className="w-5 h-5 text-sky-600" />}
              <span>Студент ретінде кіру</span>
            </button>
            <button
              id="demo-teacher-btn"
              onClick={() => handleDemo('TEACHER')}
              disabled={!!signingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-sm transition active:scale-95 disabled:opacity-50"
            >
              {signingIn === 'TEACHER' ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
              <span>Оқытушы ретінде кіру</span>
            </button>
            <button
              id="demo-admin-btn"
              onClick={() => handleDemo('SUPER_ADMIN')}
              disabled={!!signingIn}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3.5 px-6 rounded-2xl border border-slate-600 flex items-center justify-center gap-3 text-sm transition active:scale-95 disabled:opacity-50"
            >
              {signingIn === 'SUPER_ADMIN' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-purple-300" />}
              <span>Әкімші ретінде кіру</span>
            </button>
          </div>

          <div className="mt-4 text-[11px] text-slate-400">
            Демо режим — барлық деректер браузерде сақталады
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-slate-400 pb-2 z-10">
        Студенттік қатысу жүйесі PWA • 2026 жыл
      </div>

      {/* PWA Install Banner */}
      <InstallPwaPrompt />
    </div>
  );
};
