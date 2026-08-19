import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  Search,
  BookOpen,
  Award,
  Download
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { AttendanceRecord } from '../types';
import { getAttendanceByStudent } from '../firebase/firestoreService';

interface AttendanceHistoryViewProps {
  onBack: () => void;
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({ onBack }) => {
  const { currentStudent } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentStudent?.studentId) return;
      try {
        setLoading(true);
        const list = await getAttendanceByStudent(currentStudent.studentId);
        setRecords(list);
      } catch (err) {
        console.error('Error fetching attendance history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentStudent]);

  const filteredRecords = records.filter(
    (r) =>
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.date.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-sm"
            >
              <ChevronLeft className="w-5 h-5" />
              АРТҚА
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <span>Қатысу тарихы</span>
              </h2>
              <p className="text-xs text-slate-400">
                Студент: <strong className="text-emerald-400">{currentStudent?.fullName}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-4">
        {/* Attendance Summary Stat Card */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-4.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Тіркелген сабақтар саны:</div>
              <div className="text-2xl font-extrabold text-white">
                {records.length} <span className="text-xs text-emerald-400 font-semibold">сабақ</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold rounded-full text-xs">
              100% Расталған
            </span>
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пән немесе оқытушы бойынша іздеу..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Attendance List */}
        {filteredRecords.length > 0 ? (
          <div className="space-y-3">
            {filteredRecords.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-slate-100 leading-snug">
                    {item.subject}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Қатысты</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Оқытушы: <strong className="text-slate-200">{item.teacherName}</strong></span>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-amber-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-sm">
              {searchQuery ? 'Іздеу бойынша жазбалар табылмады' : 'Әзірге қатысу тарихы бос'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
