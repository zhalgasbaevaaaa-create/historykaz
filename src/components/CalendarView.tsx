import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { Lesson, AttendanceRecord } from '../types';
import { getAllLessons, getLessonsForGroup, getAttendanceByStudent } from '../firebase/firestoreService';
import { formatKazakhDayMonth, formatKazakhDate, formatKazakhDayOfWeek } from '../utils/kazakhDate';

interface CalendarViewProps {
  onBack: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onBack }) => {
  const { currentStudent, userRole } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('2026-08-18');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        let lessonList: Lesson[] = [];

        if (userRole === 'STUDENT' && currentStudent?.group) {
          lessonList = await getLessonsForGroup(currentStudent.group);
        } else {
          lessonList = await getAllLessons();
        }

        setLessons(lessonList);

        if (currentStudent?.studentId) {
          const studentAttendance = await getAttendanceByStudent(currentStudent.studentId);
          setAttendance(studentAttendance);
        }
      } catch (err) {
        console.error('Error fetching calendar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [currentStudent, userRole]);

  // Unique dates from lessons
  const availableDates = Array.from(new Set(lessons.map((l) => l.date))).sort();
  const activeDate = selectedDateFilter || (availableDates[0] || '2026-08-18');

  const filteredLessons = lessons.filter((l) => l.date === activeDate);

  const isAttended = (lessonId: string) => {
    return attendance.some((a) => a.lessonId === lessonId);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              aria-label="Артқа"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-400" />
                <span>Күнтізбе (Сабақ кестесі)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Топ: <strong className="text-sky-400">{currentStudent?.group || 'Барлық топтар'}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-4">
        {/* Date Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableDates.length > 0 ? (
            availableDates.map((dateStr) => {
              const isSelected = dateStr === activeDate;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateFilter(dateStr)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-600/30'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>
                    {dateStr === '2026-08-18'
                      ? '18 тамыз'
                      : dateStr === '2026-08-19'
                      ? '19 тамыз'
                      : dateStr === '2026-08-20'
                      ? '20 тамыз'
                      : dateStr}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-xs text-slate-400 py-2">Кестеде сабақтар табылмады</div>
          )}
        </div>

        {/* Selected Date Header */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div className="font-bold text-sky-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>
              {activeDate === '2026-08-18' ? '18 тамыз 2026 жыл (Сейсенбі)' : activeDate}
            </span>
          </div>
          <span className="text-slate-400">{filteredLessons.length} сабақ жоспарланған</span>
        </div>

        {/* Lessons List */}
        {filteredLessons.length > 0 ? (
          <div className="space-y-3.5">
            {filteredLessons.map((lesson) => {
              const attended = isAttended(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className={`bg-slate-900 border rounded-3xl p-5 shadow-lg relative overflow-hidden transition ${
                    attended
                      ? 'border-emerald-500/40 bg-slate-900/90'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar with Time & Room */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-sky-300 bg-sky-950/80 px-2.5 py-1 rounded-xl border border-sky-800/50">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        {lesson.startTime}–{lesson.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-300 font-semibold bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{lesson.classroom}-аудитория</span>
                    </div>
                  </div>

                  {/* Subject Name */}
                  <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                    {lesson.subject}
                  </h3>

                  {/* Teacher & Group */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        Оқытушы: <strong className="text-white">{lesson.teacherName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>{lesson.group}</span>
                    </div>
                  </div>

                  {/* Attendance Status Badge */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between">
                    {attended ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Қатысу тіркелді (Қатысты)</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        Сабақ уақытында QR сканерлеу қажет
                      </span>
                    )}

                    {lesson.notes && (
                      <span className="text-[11px] text-slate-500 italic truncate max-w-[180px]">
                        {lesson.notes}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-sm">Бұл күнге сабақ кестесі енгізілмеген</p>
          </div>
        )}
      </div>
    </div>
  );
};
