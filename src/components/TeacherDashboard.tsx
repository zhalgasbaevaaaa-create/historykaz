import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Clock,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  StopCircle,
  MessageSquare,
  BookOpen,
  Calendar,
  Sparkles,
  Search
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { Lesson, QrSession, AttendanceRecord, Student, StudentMessage } from '../types';
import {
  getAllLessons,
  createQrSession,
  getActiveQrSessionForLesson,
  invalidateQrSession,
  subscribeAttendanceForLesson,
  getAllStudents,
  getMessagesForTeacher,
  replyToMessage
} from '../firebase/firestoreService';
import { formatSecondsToTimer } from '../utils/kazakhDate';

export const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [activeSession, setActiveSession] = useState<QrSession | null>(null);
  const [qrPayloadString, setQrPayloadString] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'attendance' | 'messages'>('qr');
  const [replyInput, setReplyInput] = useState<{ [msgId: string]: string }>({});

  // 1. Fetch Lessons & Students on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [lessonList, studentList] = await Promise.all([
          getAllLessons(),
          getAllStudents()
        ]);

        setLessons(lessonList);
        setAllStudents(studentList);

        if (lessonList.length > 0) {
          setSelectedLessonId(lessonList[0].id);
        }
      } catch (err) {
        console.error('Error fetching teacher data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. When selected lesson changes, check for existing active session & subscribe to attendance
  useEffect(() => {
    if (!selectedLessonId) return;

    let isMounted = true;
    const checkActiveSession = async () => {
      try {
        const session = await getActiveQrSessionForLesson(selectedLessonId);
        if (session && isMounted) {
          setActiveSession(session);
          setQrPayloadString(JSON.stringify(session));
          const diff = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
          setRemainingSeconds(diff);
        } else if (isMounted) {
          setActiveSession(null);
          setQrPayloadString('');
          setRemainingSeconds(0);
        }
      } catch (e) {
        console.warn('Session check error:', e);
      }
    };

    checkActiveSession();

    // Subscribe to live real-time attendance updates for this lesson
    const unsubscribe = subscribeAttendanceForLesson(selectedLessonId, (records) => {
      if (isMounted) {
        setAttendees(records);
      }
    });

    // Fetch messages for teacher
    const currentTeacherId = lessons.find(l => l.id === selectedLessonId)?.teacherId || 'T-01';
    getMessagesForTeacher(currentTeacherId).then((msgs) => {
      if (isMounted) setMessages(msgs);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedLessonId, lessons]);

  // 3. 15-Minute Countdown Timer (Synced with Server Expiration Timestamp)
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'Active') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((activeSession.expiresAt - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        setActiveSession((prev) => (prev ? { ...prev, status: 'Expired' } : null));
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Handle QR Generation via backend API
  const handleGenerateQr = async () => {
    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (!lesson) return;

    try {
      setGenerating(true);

      const newSession = await createQrSession(lesson, 900);
      setActiveSession(newSession);
      setQrPayloadString(JSON.stringify(newSession));
      setRemainingSeconds(900);
    } catch (err) {
      console.error('Error generating QR:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleInvalidate = async () => {
    if (activeSession) {
      await invalidateQrSession(activeSession.sessionId);
      setActiveSession((prev) => (prev ? { ...prev, status: 'Invalidated' } : null));
      setRemainingSeconds(0);
    }
  };

  const handleSendReply = async (msgId: string) => {
    const text = replyInput[msgId];
    if (!text?.trim()) return;

    await replyToMessage(msgId, text.trim());
    setReplyInput((prev) => ({ ...prev, [msgId]: '' }));
    // Refresh messages
    const currentTeacherId = currentLesson?.teacherId || 'T-01';
    const updated = await getMessagesForTeacher(currentTeacherId);
    setMessages(updated);
  };

  const currentLesson = lessons.find((l) => l.id === selectedLessonId);
  const targetGroupStudents = allStudents.filter(
    (s) => !currentLesson?.group || s.group === currentLesson.group
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Оқытушы кабинеті (Teacher Portal)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Сабақты таңдап, 15 минуттық динамикалық QR код жасаңыз
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'qr'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              QR Генератор
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Қатысу тізімі</span>
              <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px]">
                {attendees.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'messages'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Студенттер хаттары</span>
              {messages.length > 0 && (
                <span className="bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {messages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-5 space-y-6">
        {/* Lesson Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 shadow-md">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Сабақты таңдаңыз:
          </label>
          <select
            id="teacher-lesson-select"
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold transition"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.date} | {l.startTime}–{l.endTime} | {l.subject} ({l.group}) — {l.classroom}-ауд.
              </option>
            ))}
          </select>
        </div>

        {/* TAB 1: QR GENERATOR */}
        {activeTab === 'qr' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Dynamic QR Presentation Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[380px]">
              {activeSession && activeSession.status === 'Active' && remainingSeconds > 0 ? (
                <>
                  {/* Active Timer Pill */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-mono font-extrabold mb-4 shadow-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Қалған уақыт: {formatSecondsToTimer(remainingSeconds)}</span>
                  </div>

                  {/* High Contrast White QR Canvas Container for Sharp Scanning */}
                  <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-emerald-400/80 mb-4 transition-all">
                    <QRCodeSVG
                      value={qrPayloadString}
                      size={230}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    Студенттерге экрандағы QR кодты сканерлеуді ұсыныңыз
                  </p>
                </>
              ) : (
                <div className="py-8 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center border border-slate-700">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-200">
                      {activeSession?.status === 'Expired' || remainingSeconds === 0
                        ? 'QR кодтың мерзімі аяқталды.'
                        : 'Белсенді QR код жоқ'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Сабаққа қатысуды бастау үшін төмендегі батырманы басыңыз.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls & Live Stats */}
            <div className="space-y-4">
              {/* Lesson Summary Card */}
              {currentLesson && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-2.5">
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Таңдалған сабақ:
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-tight">
                    {currentLesson.subject}
                  </h3>
                  <div className="text-xs text-slate-300 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <div>
                      Күні: <strong className="text-white">{currentLesson.date}</strong>
                    </div>
                    <div>
                      Уақыты: <strong className="text-white">{currentLesson.startTime}–{currentLesson.endTime}</strong>
                    </div>
                    <div>
                      Топ: <strong className="text-sky-300">{currentLesson.group}</strong>
                    </div>
                    <div>
                      Аудитория: <strong className="text-white">{currentLesson.classroom}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  id="teacher-generate-qr-btn"
                  onClick={handleGenerateQr}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-base transition transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                  <span>
                    {activeSession && activeSession.status === 'Active'
                      ? 'Жаңа QR код жасау'
                      : 'QR код жасау'}
                  </span>
                </button>

                {activeSession && activeSession.status === 'Active' && (
                  <button
                    id="teacher-invalidate-qr-btn"
                    onClick={handleInvalidate}
                    className="w-full bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800 text-rose-300 font-bold py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
                  >
                    <StopCircle className="w-4 h-4 text-rose-400" />
                    <span>QR сессиясын мерзімінен бұрын тоқтату</span>
                  </button>
                )}
              </div>

              {/* Real-time Attendees count widget */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Нақты уақытта тіркелгендер:</div>
                    <div className="text-lg font-bold text-white">
                      {attendees.length} / {targetGroupStudents.length} студент
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  Көру →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REAL-TIME ATTENDANCE LIST */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Топ бойынша қатысу журнал тізімі: {currentLesson?.group}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentLesson?.subject} • {currentLesson?.date} ({currentLesson?.startTime}–{currentLesson?.endTime})
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Қатысты: {attendees.length}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Қатыспады: {Math.max(0, targetGroupStudents.length - attendees.length)}</span>
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {targetGroupStudents.map((st) => {
                const attendRecord = attendees.find((a) => a.studentId === st.studentId || a.studentEmail === st.googleEmail);
                const hasAttended = !!attendRecord;

                return (
                  <div
                    key={st.studentId}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          hasAttended
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {hasAttended ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-100">
                          {st.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {st.studentId} • {st.googleEmail}
                        </div>
                      </div>
                    </div>

                    <div>
                      {hasAttended ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                            Қатысты
                          </span>
                          <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                            {attendRecord.time}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                          Қатыспады
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT MESSAGES INBOX */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-400" />
              <span>Студенттерден түскен хабарламалар ({messages.length})</span>
            </h3>

            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{msg.studentName}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {msg.group} • {msg.studentEmail} • {msg.studentId}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleDateString('kk-KZ')}
                      </span>
                    </div>

                    <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-xs text-slate-200">
                      <strong className="text-sky-400 block mb-1">{msg.subject}:</strong>
                      <p className="leading-relaxed">{msg.message}</p>
                    </div>

                    {msg.replyText ? (
                      <div className="bg-emerald-950/40 rounded-2xl p-3 border border-emerald-800 text-xs text-emerald-200">
                        <strong className="block text-emerald-400 mb-0.5">Сіздің жауабыңыз:</strong>
                        <p>{msg.replyText}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyInput[msg.id] || ''}
                          onChange={(e) =>
                            setReplyInput((prev) => ({ ...prev, [msg.id]: e.target.value }))
                          }
                          placeholder="Студентке жауап жазу..."
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleSendReply(msg.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
                        >
                          Жауап беру
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-sm">Студенттерден хабарлама жоқ</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
