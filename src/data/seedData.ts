import { Student, Teacher, AcademicGroup, Subject, Lesson, SystemSettings } from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  appName: 'Студенттік қатысу жүйесі',
  googleSpreadsheetId: '1Gpyy1fjJJzycEJAYk0CT9p6UnAHL3MiujmnMX8VFOeQ',
  additionalAssignmentUrl: 'https://t.me/sayasattanu_bot',
  qrValiditySeconds: 900, // 15 minutes
  allowAutoSheetSync: true,
  institutionName: 'Astana IT University / ҚазҰУ'
};

export const INITIAL_GROUPS: AcademicGroup[] = [
  { id: 'CS-2101', name: 'CS-2101', faculty: 'Компьютерлік ғылымдар', courseYear: 3, studentCount: 24 },
  { id: 'IT-2204', name: 'IT-2204', faculty: 'Ақпараттық технологиялар', courseYear: 2, studentCount: 22 },
  { id: 'IS-2302', name: 'IS-2302', faculty: 'Ақпараттық қауіпсіздік', courseYear: 1, studentCount: 20 },
  { id: 'AI-2401', name: 'AI-2401', faculty: 'Жасанды интеллект', courseYear: 1, studentCount: 18 }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'SUBJ-01', code: 'HIST-101', name: 'Қазақстан тарихы', credits: 5 },
  { id: 'SUBJ-02', code: 'CS-204', name: 'Алгоритмдер және деректер құрылымы', credits: 6 },
  { id: 'SUBJ-03', code: 'WEB-302', name: 'Веб-бағдарламалау (React/Node)', credits: 5 },
  { id: 'SUBJ-04', code: 'DB-201', name: 'Деректер қоры (PostgreSQL & NoSQL)', credits: 5 },
  { id: 'SUBJ-05', code: 'AI-401', name: 'Жасанды интеллект негіздері', credits: 6 },
  { id: 'SUBJ-06', code: 'CYBER-305', name: 'Киберқауіпсіздік', credits: 5 }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'T-01',
    teacherId: 'T-01',
    fullName: 'Профессор - Сарсенбаев А.Б.',
    email: 'zhalgasbaevaaaa@gmail.com',
    department: 'Тарих',
    phone: '',
    status: 'Active'
  }
];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'LES-01',
    lessonId: 'LES-01',
    date: '2026-08-18',
    startTime: '09:00',
    endTime: '09:50',
    subject: 'Қазақстан тарихы',
    teacherId: 'T-01',
    teacherName: 'Профессор - Сарсенбаев А.Б.',
    classroom: '301',
    group: 'CS-2101',
    isActive: true,
    notes: 'Дәріс: Қазақ хандығының қалыптасуы'
  },
  {
    id: 'LES-02',
    lessonId: 'LES-02',
    date: '2026-08-18',
    startTime: '10:00',
    endTime: '10:50',
    subject: 'Веб-бағдарламалау (React/Node)',
    teacherId: 'T-01',
    teacherName: 'Профессор - Сарсенбаев А.Б.',
    classroom: '408 (IT Lab)',
    group: 'CS-2101',
    isActive: true,
    notes: 'Практика: PWA және Service Worker интеграциясы'
  },
  {
    id: 'LES-03',
    lessonId: 'LES-03',
    date: '2026-08-18',
    startTime: '11:10',
    endTime: '12:00',
    subject: 'Алгоритмдер және деректер құрылымы',
    teacherId: 'T-02',
    teacherName: 'Профессор - Сарсенбаев А.Б.',
    classroom: '215',
    group: 'CS-2101',
    isActive: true,
    notes: 'Графтар және іздеу алгоритмдері'
  },
  {
    id: 'LES-04',
    lessonId: 'LES-04',
    date: '2026-08-18',
    startTime: '13:30',
    endTime: '14:20',
    subject: 'Деректер қоры (PostgreSQL & NoSQL)',
    teacherId: 'T-03',
    teacherName: 'Профессор - Сарсенбаев А.Б.',
    classroom: '312',
    group: 'IT-2204',
    isActive: true,
    notes: 'Транзакциялар және оқшаулау деңгейлері'
  },
  {
    id: 'LES-05',
    lessonId: 'LES-05',
    date: '2026-08-19',
    startTime: '09:00',
    endTime: '09:50',
    subject: 'Жасанды интеллект негіздері',
    teacherId: 'T-02',
    teacherName: 'Профессор - Сарсенбаев А.Б.',
    classroom: '502 (AI Lab)',
    group: 'CS-2101',
    isActive: true
  },
  {
    id: 'LES-06',
    lessonId: 'LES-06',
    date: '2026-08-19',
    startTime: '10:00',
    endTime: '10:50',
    subject: 'Киберқауіпсіздік',
    teacherId: 'T-03',
    teacherName: 'Профессор - Сарсенбаев А.Б.',
    classroom: '204',
    group: 'CS-2101',
    isActive: true
  }
];
