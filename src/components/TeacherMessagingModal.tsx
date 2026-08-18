import React, { useState, useEffect } from 'react';
import { Send, X, User, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { Teacher } from '../types';
import { getAllTeachers, sendStudentMessage } from '../firebase/firestoreService';

interface TeacherMessagingModalProps {
  onClose: () => void;
}

export const TeacherMessagingModal: React.FC<TeacherMessagingModalProps> = ({ onClose }) => {
  const { currentUser, currentStudent } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successSent, setSuccessSent] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const list = await getAllTeachers();
        setTeachers(list);
        if (list.length > 0) {
          setSelectedTeacherId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching teachers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedTeacherId) {
      setErrorMsg('Хабарлама мәтіні мен оқытушыны таңдаңыз.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const teacherObj = teachers.find((t) => t.id === selectedTeacherId);
      const studentId = currentStudent?.studentId || 'ST-2026-001';
      const studentName = currentStudent?.fullName || currentUser?.displayName || 'Студент';
      const studentEmail = currentUser?.email || 'student@university.kz';
      const group = currentStudent?.group || 'CS-2101';

      await sendStudentMessage({
        studentId,
        studentName,
        studentEmail,
        group,
        teacherId: selectedTeacherId,
        teacherName: teacherObj?.fullName || 'Оқытушы',
        subject: subject.trim() || 'Сұрақ / Өтініш',
        message: message.trim()
      });

      setSuccessSent(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setErrorMsg('Хабарлама жіберу кезінде қате пайда болды. Қайта көріңіз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl shadow-slate-950 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Жабу"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Оқытушыға жазу</h3>
            <p className="text-xs text-slate-400">Хабарламаңыз оқытушының жеке кабинетіне түседі</p>
          </div>
        </div>

        {successSent ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-emerald-400">Хабарлама сәтті жіберілді!</h4>
            <p className="text-xs text-slate-300">Оқытушы жауап берген кезде тарихыңыздан көре аласыз.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Info auto-attached badge */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-400">Жіберуші: </span>
                <strong className="text-white">{currentStudent?.fullName || currentUser?.displayName}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800 text-[11px] font-mono">
                  {currentStudent?.group || 'CS-2101'}
                </span>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                  {currentStudent?.studentId || 'ID'}
                </span>
              </div>
            </div>

            {/* Select Teacher */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Оқытушыны таңдаңыз:
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Оқытушылар жүктелуде...</span>
                </div>
              ) : (
                <select
                  id="select-teacher-dropdown"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
                  required
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} — {t.department}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Subject input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Тақырыбы (Subject):
              </label>
              <input
                id="message-subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Мысалы: Сабақ бойынша сұрақ немесе себепті қатыспау"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            {/* Message input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Хабарлама мәтіні:
              </label>
              <textarea
                id="message-body-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Оқытушыға сұрағыңызды немесе хабарламаңызды жазыңыз..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition resize-none"
                required
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2.5 pt-2">
              <button
                id="send-message-submit-btn"
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-sky-600/30 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Жіберілуде...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Жіберу</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
              >
                Бас тарту
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
