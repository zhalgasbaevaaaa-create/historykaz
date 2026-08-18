import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  QrCode,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { InstallPwaPrompt } from './InstallPwaPrompt';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('Google арқылы кіру кезінде ақау пайда болды. Қайта көріңіз.');
      }
    } finally {
      setSigningIn(false);
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

          {/* Real Google Sign In Button */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-sm sm:text-base transition transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {signingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                <span>Аутентификация жүруде...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
                <span>Google арқылы кіру</span>
              </>
            )}
          </button>

          <div className="mt-4 text-[11px] text-slate-400">
            Тек авторизацияланған студенттер мен оқытушыларға арналған
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
