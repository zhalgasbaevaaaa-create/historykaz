import React, { useEffect } from 'react';
import { CheckCircle2, Calendar, Clock, BookOpen, User, Users, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord } from '../types';

interface AttendanceSuccessModalProps {
  record: AttendanceRecord;
  onClose: () => void;
}

export const AttendanceSuccessModal: React.FC<AttendanceSuccessModalProps> = ({ record, onClose }) => {
  useEffect(() => {
    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#fbbf24', '#ffffff']
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/60 text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Жабу"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Green Checkmark */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/40 mb-6 animate-bounce">
          <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 stroke-[2.5]" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
          </div>
        </div>

        {/* Main Title Required: "Сіз сабақтасыз!" */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight leading-tight">
          Сіз сабақтасыз!
        </h2>
        <p className="text-sm text-slate-300 font-medium mt-1">
          Қатысу сәтті тіркелді және деректер базасына сақталды
        </p>

        {/* Attendance Details Card */}
        <div className="mt-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center shrink-0 border border-sky-800/40">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Пән (Subject):</div>
              <div className="text-sm font-bold text-slate-100 leading-snug">
                {record.subject}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/40">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Оқытушы (Teacher):</div>
              <div className="text-sm font-bold text-slate-100">
                {record.teacherName}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <div>
                <span className="text-slate-400">Күні: </span>
                <span className="font-bold text-slate-200">{record.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="text-slate-400">Уақыты: </span>
                <span className="font-bold text-slate-200">{record.time}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Топ: <strong className="text-slate-200">{record.group}</strong></span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
              Мәртебе: Қатысты
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="close-success-modal-btn"
          onClick={onClose}
          className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/30 transition transform active:scale-95 text-base cursor-pointer"
        >
          Жабу
        </button>
      </div>
    </div>
  );
};
