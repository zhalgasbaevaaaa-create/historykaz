import React, { useState } from 'react';
import { Send, X, MessageSquare, CheckCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { sendStudentMessage } from '../firebase/firestoreService';

const TEACHER_NAME = 'Профессор - Сарсенбаев А.Б.';
const TEACHER_EMAIL = 'zhalgasbaevaaaa@gmail.com';

interface TeacherMessagingModalProps {
  onClose: () => void;
}

export const TeacherMessagingModal: React.FC<TeacherMessagingModalProps> = ({ onClose }) => {
  const { currentUser, currentStudent } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successSent, setSuccessSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Хабарлама мәтінін жазыңыз.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const studentName = currentStudent?.fullName || currentUser?.displayName || 'Студент';
    const studentEmail = currentUser?.email || '';
    const topic = subject.trim() || 'Сұрақ / Өтініш';
    const body = [
      `Оқытушы: ${TEACHER_NAME}`,
      `Студент: ${studentName}`,
      `Email: ${studentEmail}`,
      `Тақырып: ${topic}`,
      '',
      message.trim()
    ].join('\n');

    try {
      await sendStudentMessage({
        studentId: currentStudent?.studentId || currentUser?.uid || '',
        studentName,
        studentEmail,
        group: currentStudent?.group || '',
        teacherId: 'T-01',
        teacherName: TEACHER_NAME,
        subject: topic,
        message: message.trim()
      });

      const res = await fetch(`https://formsubmit.co/ajax/${TEACHER_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: studentName,
          email: studentEmail || 'noreply@historykaz.local',
          _subject: `Оқытушыға хат: ${topic}`,
          message: body
        })
      });

      if (!res.ok) {
        window.location.href = `mailto:${TEACHER_EMAIL}?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(body)}`;
      }

      setSuccessSent(true);
      setTimeout(() => onClose(), 1600);
    } catch {
      window.location.href = `mailto:${TEACHER_EMAIL}?subject=${encodeURIComponent(topic)}&body=${encodeURIComponent(body)}`;
      setSuccessSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="mb-4 inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          АРТҚА
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Оқытушыға жазу</h3>
            <p className="text-xs text-slate-400">Хат {TEACHER_EMAIL} поштасына жіберіледі</p>
          </div>
        </div>

        {successSent ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-emerald-400">Хабарлама жіберілді</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Оқытушы</label>
              <select
                value="T-01"
                disabled
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              >
                <option value="T-01">{TEACHER_NAME}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Тақырыбы</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Хабарлама</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 resize-none"
              />
            </div>
            {errorMsg && <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2.5 rounded-xl">{errorMsg}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Жіберу</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
