import { Student, Teacher, AcademicGroup, Subject, Lesson, SystemSettings } from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  appName: 'Студенттік қатысу жүйесі',
  googleSpreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  additionalAssignmentUrl: 'https://kundelik.kz',
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
    fullName: 'А. Сәрсенбаев',
    email: 'sarsenbayev.teacher@gmail.com',
    department: 'Компьютерлік инженерия',
    phone: '+7 777 123 4567',
    status: 'Active'
  },
  {
    id: 'T-02',
    teacherId: 'T-02',
    fullName: 'Г. Нұрғалиева',
    email: 'nurgaliyeva.teacher@gmail.com',
    department: 'Жасанды интеллект және Big Data',
    phone: '+7 701 987 6543',
    status: 'Active'
  },
  {
    id: 'T-03',
    teacherId: 'T-03',
    fullName: 'М. Құдайбергенов',
    email: 'kudaibergenov.teacher@gmail.com',
    department: 'Ақпараттық қауіпсіздік',
    phone: '+7 705 555 4433',
    status: 'Active'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'ST-2026-001',
    studentId: 'ST-2026-001',
    fullName: 'Ахметов Айбек Қайратұлы',
    googleEmail: 'akonyaalex@gmail.com', // Admin / Test Student
    group: 'CS-2101',
    status: 'Active',
    notes: 'Студенттер кеңесінің төрағасы',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'ST-2026-002',
    studentId: 'ST-2026-002',
    fullName: 'Сәрсенова Аружан Мұратқызы',
    googleEmail: 'aruzhan.sarsenova@gmail.com',
    group: 'CS-2101',
    status: 'Active',
    notes: 'Академиялық үздік',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'ST-2026-003',
    studentId: 'ST-2026-003',
    fullName: 'Қасымов Данияр Ерланұлы',
    googleEmail: 'daniyar.kassymov@gmail.com',
    group: 'CS-2101',
    status: 'Active',
    notes: 'Хакатон жеңімпазы',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'ST-2026-004',
    studentId: 'ST-2026-004',
    fullName: 'Бақытжанқызы Динара',
    googleEmail: 'dinara.bakhytzhan@gmail.com',
    group: 'IT-2204',
    status: 'Active',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'ST-2026-005',
    studentId: 'ST-2026-005',
    fullName: 'Оспанов Бауыржан Серікұлы',
    googleEmail: 'bauyrzhan.ospanov@gmail.com',
    group: 'IT-2204',
    status: 'Active',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'ST-2026-006',
    studentId: 'ST-2026-006',
    fullName: 'Ермеков Әлихан Болатұлы',
    googleEmail: 'alikhan.ermekov@gmail.com',
    group: 'IS-2302',
    status: 'Inactive',
    notes: 'Академиялық демалыста',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'ST-2026-007',
    studentId: 'ST-2026-007',
    fullName: 'Мұхтаров Нұрсұлтан',
    googleEmail: 'nursultan.mukhtarov@gmail.com',
    group: 'AI-2401',
    status: 'Blocked',
    notes: 'Тәртіптік ереже бұзушылық',
    createdAt: '2026-01-15T08:00:00.000Z'
  }
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'LES-01',
    lessonId: 'LES-01',
    date: '2026-08-18',
    startTime: '09:00',
    endTime: '09:50',
    subject: 'Қазақстан тарихы',
    teacherId: 'T-01',
    teacherName: 'А. Сәрсенбаев',
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
    teacherName: 'А. Сәрсенбаев',
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
    teacherName: 'Г. Нұрғалиева',
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
    teacherName: 'М. Құдайбергенов',
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
    teacherName: 'Г. Нұрғалиева',
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
    teacherName: 'М. Құдайбергенов',
    classroom: '204',
    group: 'CS-2101',
    isActive: true
  }
];
