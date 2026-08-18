import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Settings as SettingsIcon,
  FileSpreadsheet,
  Activity,
  Plus,
  Trash2,
  Edit2,
  Search,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';
import {
  Student,
  Teacher,
  AcademicGroup,
  Subject,
  Lesson,
  AttendanceRecord,
  SystemSettings,
  AuditLog
} from '../types';
import {
  getAllStudents,
  saveStudent,
  deleteStudent,
  getAllTeachers,
  saveTeacher,
  deleteTeacher,
  getAllGroups,
  saveGroup,
  deleteGroup,
  getAllSubjects,
  saveSubject,
  deleteSubject,
  getAllLessons,
  saveLesson,
  deleteLesson,
  getAllAttendanceRecords,
  getSystemSettings,
  updateSystemSettings,
  getAuditLogs,
  logAuditEvent
} from '../firebase/firestoreService';
import { useAuth } from '../firebase/authContext';

export const AdminPanel: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'students' | 'teachers' | 'schedule' | 'sheets' | 'settings' | 'audit'
  >('students');

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  // Modal / form states
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>({
    studentId: '',
    fullName: '',
    googleEmail: '',
    group: 'CS-2101',
    status: 'Active'
  });

  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson>>({
    id: '',
    date: '2026-08-18',
    startTime: '09:00',
    endTime: '09:50',
    subject: 'Қазақстан тарихы',
    teacherName: 'А. Сәрсенбаев',
    classroom: '301',
    group: 'CS-2101',
    isActive: true
  });

  const [syncingSheets, setSyncingSheets] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const refreshAll = async () => {
    try {
      setLoading(true);
      const [
        stList,
        tcList,
        grpList,
        sbList,
        lsList,
        atList,
        stg,
        logs
      ] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        getAllGroups(),
        getAllSubjects(),
        getAllLessons(),
        getAllAttendanceRecords(),
        getSystemSettings(),
        getAuditLogs()
      ]);

      setStudents(stList);
      setTeachers(tcList);
      setGroups(grpList);
      setSubjects(sbList);
      setLessons(lsList);
      setAttendance(atList);
      setSettings(stg);
      setAuditLogs(logs);
    } catch (e) {
      console.error('Error refreshing admin panel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Student CRUD
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent.studentId || !editingStudent.fullName || !editingStudent.googleEmail) {
      alert('Барлық өрістерді толтырыңыз');
      return;
    }

    const studentToSave: Student = {
      id: editingStudent.studentId,
      studentId: editingStudent.studentId,
      fullName: editingStudent.fullName,
      googleEmail: editingStudent.googleEmail.trim().toLowerCase(),
      group: editingStudent.group || 'CS-2101',
      status: (editingStudent.status as any) || 'Active',
      createdAt: editingStudent.createdAt || new Date().toISOString()
    };

    await saveStudent(studentToSave);
    await logAuditEvent(
      'SAVE_STUDENT',
      currentUser?.email || 'admin',
      userRole,
      `Студент сақталды: ${studentToSave.fullName} (${studentToSave.googleEmail})`
    );

    setShowStudentModal(false);
    refreshAll();
  };

  const handleToggleStatus = async (student: Student, newStatus: 'Active' | 'Inactive' | 'Blocked') => {
    await saveStudent({ ...student, status: newStatus });
    await logAuditEvent(
      'UPDATE_STUDENT_STATUS',
      currentUser?.email || 'admin',
      userRole,
      `${student.fullName} мәртебесі өзгертілді: ${newStatus}`
    );
    refreshAll();
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('Студентті шынымен өшіргіңіз келе ме?')) {
      await deleteStudent(studentId);
      refreshAll();
    }
  };

  // Lesson CRUD
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingLesson.id || 'LES-' + Date.now().toString().slice(-4);
    const lessonToSave: Lesson = {
      id,
      lessonId: id,
      date: editingLesson.date || '2026-08-18',
      startTime: editingLesson.startTime || '09:00',
      endTime: editingLesson.endTime || '09:50',
      subject: editingLesson.subject || 'Пән',
      teacherId: editingLesson.teacherId || 'T-01',
      teacherName: editingLesson.teacherName || 'А. Сәрсенбаев',
      classroom: editingLesson.classroom || '101',
      group: editingLesson.group || 'CS-2101',
      isActive: true
    };

    await saveLesson(lessonToSave);
    setShowLessonModal(false);
    refreshAll();
  };

  // Google Sheets Sync Trigger
  const handleTriggerSheetsSync = async () => {
    setSyncingSheets(true);
    setSyncStatusMsg(null);
    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: settings?.googleSpreadsheetId })
      });
      const data = await res.json();
      setSyncStatusMsg(`Синхрондау сәтті орындалды! Журналға ${attendance.length} жазба қосылды.`);
      await logAuditEvent('SHEETS_SYNC', currentUser?.email || 'admin', userRole, 'Google Sheets синхрондау');
    } catch (e: any) {
      setSyncStatusMsg('Синхрондау кезінде ақау: ' + e.message);
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await fetch('/api/sheets/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: attendance })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert('CSV экспорттау кезінде ақау');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await updateSystemSettings(settings);
    alert('Жүйелік параметрлер сәтті жаңартылды!');
    refreshAll();
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.googleEmail.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesGroup = groupFilter === 'ALL' || s.group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Басқару панелі (Super Admin)</h2>
              <p className="text-xs text-slate-400">Студенттер, кесте және Google Sheets интеграциясы</p>
            </div>
          </div>

          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Жаңарту</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'students' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Студенттер ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'teachers' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Оқытушылар ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'schedule' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Сабақ кестесі ({lessons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sheets' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets ({attendance.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Параметрлер</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'audit' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Аудит журналы</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* 1. STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Аты-жөні, email немесе ID..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="ALL">Барлық топтар</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <button
                id="admin-add-student-btn"
                onClick={() => {
                  setEditingStudent({
                    studentId: 'ST-2026-' + String(students.length + 1).padStart(3, '0'),
                    fullName: '',
                    googleEmail: '',
                    group: 'CS-2101',
                    status: 'Active'
                  });
                  setShowStudentModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Жаңа студент қосу</span>
              </button>
            </div>

            {/* Students Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Студент ID</th>
                      <th className="py-3 px-4">Аты-жөні</th>
                      <th className="py-3 px-4">Google Email</th>
                      <th className="py-3 px-4">Топ</th>
                      <th className="py-3 px-4">Мәртебесі</th>
                      <th className="py-3 px-4 text-right">Әрекеттер</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredStudents.map((st) => (
                      <tr key={st.studentId} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-sky-400">{st.studentId}</td>
                        <td className="py-3 px-4 font-semibold text-white">{st.fullName}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{st.googleEmail}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                            {st.group}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.status === 'Active'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : st.status === 'Blocked'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {st.status === 'Active' ? 'Белсенді' : st.status === 'Blocked' ? 'Бұғатталған' : 'Демалыста'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {st.status === 'Active' ? (
                            <button
                              onClick={() => handleToggleStatus(st, 'Blocked')}
                              title="Бұғаттау"
                              className="p-1.5 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(st, 'Active')}
                              title="Белсенді ету"
                              className="p-1.5 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingStudent(st);
                              setShowStudentModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st.studentId)}
                            className="p-1.5 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Оқытушылар құрамы</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teachers.map((tc) => (
                <div key={tc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="font-bold text-white text-base">{tc.fullName}</div>
                  <div className="text-xs text-sky-400 font-mono">{tc.email}</div>
                  <div className="text-xs text-slate-400">{tc.department}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{tc.phone}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Сабақ кестесі (Lessons)</h3>
              <button
                onClick={() => {
                  setEditingLesson({
                    id: 'LES-' + Date.now().toString().slice(-4),
                    date: '2026-08-18',
                    startTime: '09:00',
                    endTime: '09:50',
                    subject: 'Жаңа пән',
                    teacherName: 'А. Сәрсенбаев',
                    classroom: '301',
                    group: 'CS-2101'
                  });
                  setShowLessonModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Сабақ қосу</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {lessons.map((ls) => (
                <div key={ls.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-sky-400">{ls.date} | {ls.startTime}–{ls.endTime}</span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">{ls.group}</span>
                  </div>
                  <h4 className="font-bold text-white text-base">{ls.subject}</h4>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Оқытушы: {ls.teacherName}</span>
                    <span className="text-rose-400">{ls.classroom}-ауд.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. GOOGLE SHEETS TAB */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Google Sheets Синхрондау Орталығы</h3>
                  <p className="text-xs text-slate-300">
                    Барлық расталған қатысу деректері күн сайынғы бөлек парақтарға (мысалы: 18.08.2026) жазылады.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Тағайындалған Google Spreadsheet ID:</span>
                  <span className="font-mono text-emerald-400 font-bold">{settings?.googleSpreadsheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Жүйеде сақталған жазбалар:</span>
                  <span className="font-bold text-white">{attendance.length} студенттік қатысу жазбасы</span>
                </div>
              </div>

              {syncStatusMsg && (
                <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-xl">
                  {syncStatusMsg}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  id="trigger-sheets-sync-btn"
                  onClick={handleTriggerSheetsSync}
                  disabled={syncingSheets}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-700/30 transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingSheets ? 'animate-spin' : ''}`} />
                  <span>Google Sheets-ке қолмен синхрондау</span>
                </button>

                <button
                  id="export-attendance-csv-btn"
                  onClick={handleExportCsv}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Күндік CSV есебін жүктеп алу</span>
                </button>
              </div>
            </div>

            {/* Attendance Master Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h4 className="font-bold text-white text-sm">Қатысу жазбалары журналы ({attendance.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Күні & Уақыты</th>
                      <th className="py-2.5 px-3">Студент</th>
                      <th className="py-2.5 px-3">Топ</th>
                      <th className="py-2.5 px-3">Пән</th>
                      <th className="py-2.5 px-3">Оқытушы</th>
                      <th className="py-2.5 px-3">Мәртебе</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {attendance.map((at) => (
                      <tr key={at.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-sky-400">{at.date} {at.time}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{at.studentName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{at.group}</td>
                        <td className="py-2.5 px-3 text-slate-200">{at.subject}</td>
                        <td className="py-2.5 px-3 text-slate-400">{at.teacherName}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-800">
                            {at.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. SETTINGS TAB */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 max-w-xl">
            <h3 className="font-bold text-white text-base">Жүйелік параметрлерді баптау</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Қосымша атауы (Application Name):
              </label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Google Spreadsheet ID (Attendance Reporting Sheet):
              </label>
              <input
                type="text"
                value={settings.googleSpreadsheetId}
                onChange={(e) => setSettings({ ...settings, googleSpreadsheetId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Қосымша тапсырмалар сілтемесі (ADDITIONAL_ASSIGNMENT_URL):
              </label>
              <input
                type="url"
                value={settings.additionalAssignmentUrl}
                onChange={(e) => setSettings({ ...settings, additionalAssignmentUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Оқу орнының атауы:
              </label>
              <input
                type="text"
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-lg transition"
            >
              Параметрлерді сақтау
            </button>
          </form>
        )}

        {/* 6. AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-white text-base">Қауіпсіздік және әрекеттер аудиті (Audit Log)</h3>
            <div className="divide-y divide-slate-800 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex justify-between items-center gap-3">
                  <div>
                    <span className="font-bold text-purple-400">{log.action}</span>
                    <span className="text-slate-300 ml-2">{log.details}</span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.userEmail} ({log.role})</div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleTimeString('kk-KZ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student Edit Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveStudent} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-white text-base">Студент ақпараты</h4>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Студент ID:</label>
              <input
                type="text"
                value={editingStudent.studentId || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Толық аты-жөні:</label>
              <input
                type="text"
                value={editingStudent.fullName || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Google Email (Аутентификация):</label>
              <input
                type="email"
                value={editingStudent.googleEmail || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, googleEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Топ:</label>
                <select
                  value={editingStudent.group || 'CS-2101'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, group: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Мәртебесі:</label>
                <select
                  value={editingStudent.status || 'Active'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Active">Active (Белсенді)</option>
                  <option value="Inactive">Inactive (Белсенді емес)</option>
                  <option value="Blocked">Blocked (Бұғатталған)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs">
                Сақтау
              </button>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Бас тарту
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson Edit Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveLesson} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-white text-base">Сабақты қосу / өңдеу</h4>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Пән атауы:</label>
              <input
                type="text"
                value={editingLesson.subject || ''}
                onChange={(e) => setEditingLesson({ ...editingLesson, subject: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Күні:</label>
                <input
                  type="date"
                  value={editingLesson.date || '2026-08-18'}
                  onChange={(e) => setEditingLesson({ ...editingLesson, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Топ:</label>
                <select
                  value={editingLesson.group || 'CS-2101'}
                  onChange={(e) => setEditingLesson({ ...editingLesson, group: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Басталуы:</label>
                <input
                  type="time"
                  value={editingLesson.startTime || '09:00'}
                  onChange={(e) => setEditingLesson({ ...editingLesson, startTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Аяқталуы:</label>
                <input
                  type="time"
                  value={editingLesson.endTime || '09:50'}
                  onChange={(e) => setEditingLesson({ ...editingLesson, endTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Оқытушы:</label>
                <input
                  type="text"
                  value={editingLesson.teacherName || 'А. Сәрсенбаев'}
                  onChange={(e) => setEditingLesson({ ...editingLesson, teacherName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Аудитория:</label>
                <input
                  type="text"
                  value={editingLesson.classroom || '301'}
                  onChange={(e) => setEditingLesson({ ...editingLesson, classroom: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs">
                Сақтау
              </button>
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Бас тарту
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
