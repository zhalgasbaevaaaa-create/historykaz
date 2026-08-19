import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  QrCode,
  Loader2,
  CheckCircle2,
  BookOpen,
  Lock,
  User,
  Mail
} from 'lucide-react';
import { useAuth, STUDENT_ACCESS_CODE } from '../firebase/authContext';
import { InstallPwaPrompt } from './InstallPwaPrompt';

export const LoginScreen: React.FC = () => {
  const { signInStudent, signInTeacher } = useAuth();
  const [signingIn, setSigningIn] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showTeacher, setShowTeacher] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const handleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn('STUDENT');
    setAuthError(null);
    try {
      await signInStudent(fullName, accessCode, email);
    } catch (err: any) {
      setAuthError(err?.message || 'Кіру қатесі');
    } finally {
      setSigningIn(null);
    }
  };

  const handleTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn('TEACHER');
    setAuthError(null);
    try {
      await signInTeacher(teacherPassword);
    } catch {
      setAuthError('Құпиясөз қате. Қайта енгізіңіз.');
    } finally {
      setSigningIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden text-slate-100">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md mx-auto w-full pt-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-tight">Студенттік қатысу</span>
            <div className="text-[10px] text-sky-400 font-mono">PWA Attendance Portal</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Қауіпсіз жүйе</span>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full my-auto py-8 z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl mb-6">
            <QrCode className="w-10 h-10 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
            Сабаққа қатысуды QR арқылы тіркеу
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
            Аты-жөніңіз бен Gmail-іңізді жазып, ортақ кодпен кіріңіз.
          </p>

          <div className="my-5 bg-sky-950/50 border border-sky-800 rounded-2xl p-3 text-left">
            <div className="text-[11px] text-sky-300 font-semibold">Студенттерге ортақ код:</div>
            <div className="text-lg font-extrabold text-white tracking-wide font-mono mt-0.5">{STUDENT_ACCESS_CODE}</div>
          </div>

          {authError && (
            <div className="mb-4 text-xs text-rose-300 bg-rose-950/50 border border-rose-800 p-3 rounded-xl text-left">
              {authError}
            </div>
          )}

          <div className="space-y-2.5">
            {!showTeacher && (
              <form onSubmit={handleStudent} className="bg-slate-950/80 border border-sky-800/40 rounded-2xl p-3 space-y-2.5 text-left">
                <label className="text-xs text-sky-300 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Аты-жөніңіз
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Мысалы: Ахметов Айбек"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
                <label className="text-xs text-sky-300 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Gmail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
                <label className="text-xs text-sky-300 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Ортақ код
                </label>
                <input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder={STUDENT_ACCESS_CODE}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={!!signingIn}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {signingIn === 'STUDENT' ? <Loader2 className="w-4 h-4 animate-spin text-sky-600" /> : <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                  <span>Студент ретінде кіру</span>
                </button>
              </form>
            )}

            {!showTeacher ? (
              <button
                type="button"
                onClick={() => setShowTeacher(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-sm transition"
              >
                <BookOpen className="w-5 h-5" />
                <span>Оқытушы ретінде кіру</span>
              </button>
            ) : (
              <form onSubmit={handleTeacher} className="bg-slate-950/80 border border-emerald-800/50 rounded-2xl p-3 space-y-2.5 text-left">
                <label className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Оқытушы құпиясөзі
                </label>
                <input
                  type="password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!!signingIn}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {signingIn === 'TEACHER' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Кіру</span>
                </button>
                <button type="button" onClick={() => setShowTeacher(false)} className="w-full text-xs text-slate-400">
                  Студент кіруіне оралу
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full text-center text-xs text-slate-400 pb-2 z-10">
        Студенттік қатысу жүйесі PWA • 2026 жыл
      </div>
      <InstallPwaPrompt />
    </div>
  );
};
