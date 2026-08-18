import React, { useState, useEffect } from 'react';
import {
  Calendar,
  QrCode,
  MessageSquare,
  ExternalLink,
  History,
  User,
  LogOut,
  Clock,
  MapPin,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { Lesson, AttendanceRecord, SystemSettings } from '../types';
import { getLessonsForGroup, getSystemSettings, getAttendanceByStudent } from '../firebase/firestoreService';
import { QrScannerModal } from './QrScannerModal';
import { AttendanceSuccessModal } from './AttendanceSuccessModal';
import { AttendanceFailureModal } from './AttendanceFailureModal';
import { TeacherMessagingModal } from './TeacherMessagingModal';
import { formatKazakhDate } from '../utils/kazakhDate';
import { isQrBlocked, DOUBLE_MARK_MSG } from '../utils/deviceLock';

interface StudentDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser, currentStudent, signOut } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [now, setNow] = useState(new Date());

  // Modals state
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showFailureModal, setShowFailureModal] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>('');
  const [successRecord, setSuccessRecord] = useState<AttendanceRecord | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);

  useEffect(() => {
    const loadStudentData = async () => {
      const groupName = currentStudent?.group || 'CS-2101';
      const studentId = currentStudent?.studentId || 'ST-2026-001';

      try {
        const [groupLessons, systemSettings, attendanceList] = await Promise.all([
          getLessonsForGroup(groupName),
          getSystemSettings(),
          getAttendanceByStudent(studentId)
        ]);

        setLessons(groupLessons);
        setSettings(systemSettings);
        setRecentAttendance(attendanceList);
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      }
    };

    loadStudentData();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [currentStudent]);

  // Handle Attendance Scanner callbacks
  const handleScanSuccess = (record: AttendanceRecord) => {
    setShowScanner(false);
    setSuccessRecord(record);
    setShowSuccessModal(true);
    // Refresh student attendance records
    if (currentStudent?.studentId) {
      getAttendanceByStudent(currentStudent.studentId).then(setRecentAttendance);
    }
  };

  const handleScanFailure = (reason: string) => {
    setShowScanner(false);
    setFailureReason(reason);
    setShowFailureModal(true);
  };

  const handleOpenAssignments = () => {
    window.open('https://t.me/sayasattanu_bot', '_blank', 'noopener,noreferrer');
  };

  const currentLesson = lessons[0] || null;
  const isAlreadyAttendedToday = recentAttendance.some(
    (a) => a.lessonId === currentLesson?.id
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {/* Hero Welcome Header */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent pt-6 pb-6 px-4 border-b border-slate-800/60">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{formatKazakhDate(now)}</span>
            </div>
            <div className="text-xs font-mono text-sky-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}:{String(now.getSeconds()).padStart(2, '0')}
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Қош келдіңіз, құрметті студент!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            SU, History class
          </p>
          <div className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 inline-block mt-2">
            Топ: <strong className="text-sky-300">HC-2026-2027</strong>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-6">
        {/* 4 PRIMARY TOUCH-FRIENDLY ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* 1. Күнтізбе */}
          <button
            id="student-btn-calendar"
            onClick={() => onNavigateTab('calendar')}
            className="group relative bg-gradient-to-br from-slate-900 to-slate-800/90 hover:from-slate-800 hover:to-slate-700/90 border border-slate-700/80 hover:border-sky-500/50 rounded-3xl p-5 text-left transition-all duration-200 shadow-lg shadow-slate-950/50 active:scale-95 cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                Күнтізбе
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Сабақ кестесі және аудиториялар</p>
            </div>
          </button>

          {/* 2. Сабаққа тіркелу (REAL QR SCANNER) */}
          <button
            id="student-btn-register-attendance"
            onClick={() => {
              if (isQrBlocked()) {
                setFailureReason(DOUBLE_MARK_MSG);
                setShowFailureModal(true);
                return;
              }
              setShowScanner(true);
            }}
            className="group relative bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-3xl p-5 text-left transition-all duration-200 shadow-xl shadow-sky-600/30 active:scale-95 cursor-pointer flex flex-col justify-between min-h-[140px] border border-sky-400/40"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                Сабаққа тіркелу
              </h4>
              <p className="text-[11px] text-sky-100 mt-1">Камера арқылы QR сканерлеу</p>
            </div>
          </button>

          {/* 3. Оқытушыға жазу */}
          <button
            id="student-btn-message-teacher"
            onClick={() => setShowMessagingModal(true)}
            className="group relative bg-gradient-to-br from-slate-900 to-slate-800/90 hover:from-slate-800 hover:to-slate-700/90 border border-slate-700/80 hover:border-indigo-500/50 rounded-3xl p-5 text-left transition-all duration-200 shadow-lg shadow-slate-950/50 active:scale-95 cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                Оқытушыға жазу
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Жеке хабарлама жіберу</p>
            </div>
          </button>

          {/* 4. Қосымша тапсырмалар (External LMS URL) */}
          <button
            id="student-btn-extra-assignments"
            onClick={handleOpenAssignments}
            className="group relative bg-gradient-to-br from-slate-900 to-slate-800/90 hover:from-slate-800 hover:to-slate-700/90 border border-slate-700/80 hover:border-amber-500/50 rounded-3xl p-5 text-left transition-all duration-200 shadow-lg shadow-slate-950/50 active:scale-95 cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                Қосымша тапсырмалар
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Үй жұмысы және онлайн платформа</p>
            </div>
          </button>
        </div>

        {/* SECONDARY NAVIGATION ITEMS (Қатысу тарихы, Профиль, Аккаунттан шығу) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-lg divide-y divide-slate-800">
          {/* Қатысу тарихы */}
          <button
            id="student-link-history"
            onClick={() => onNavigateTab('history')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 rounded-2xl transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100">Қатысу тарихы</div>
                <div className="text-[11px] text-slate-400">
                  Барлығы: {recentAttendance.length} сабақ тіркелді
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>

          {/* Профиль */}
          <button
            id="student-link-profile"
            onClick={() => onNavigateTab('profile')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 rounded-2xl transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100">Профиль</div>
                <div className="text-[11px] text-slate-400">
                  {currentStudent?.fullName || currentUser?.displayName} • HC-2026-2027
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>

          {/* Аккаунттан шығу */}
          <button
            id="student-link-signout"
            onClick={() => signOut()}
            className="w-full flex items-center justify-between p-3.5 hover:bg-rose-950/30 rounded-2xl transition text-left text-rose-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-rose-300">Аккаунттан шығу</div>
                <div className="text-[11px] text-rose-400/80">Сессияны қауіпсіз аяқтау</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400/60" />
          </button>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {showScanner && (
        <QrScannerModal
          onSuccess={handleScanSuccess}
          onFailure={handleScanFailure}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && successRecord && (
        <AttendanceSuccessModal
          record={successRecord}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <AttendanceFailureModal
          errorReason={failureReason}
          onRetry={() => {
            setShowFailureModal(false);
            if (isQrBlocked()) return;
            setShowScanner(true);
          }}
          onClose={() => setShowFailureModal(false)}
        />
      )}

      {/* Messaging Modal */}
      {showMessagingModal && (
        <TeacherMessagingModal onClose={() => setShowMessagingModal(false)} />
      )}
    </div>
  );
};
