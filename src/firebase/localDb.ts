import {
  Student,
  Teacher,
  AcademicGroup,
  Subject,
  Lesson,
  QrSession,
  AttendanceRecord,
  StudentMessage,
  SystemSettings,
  AuditLog
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_GROUPS,
  INITIAL_SUBJECTS,
  INITIAL_LESSONS
} from '../data/seedData';

const KEY = 'historykaz-db-v1';

interface LocalDb {
  settings: SystemSettings;
  students: Student[];
  teachers: Teacher[];
  groups: AcademicGroup[];
  subjects: Subject[];
  lessons: Lesson[];
  qrSessions: QrSession[];
  attendance: AttendanceRecord[];
  messages: StudentMessage[];
  audit: AuditLog[];
}

function seed(): LocalDb {
  return {
    settings: { ...INITIAL_SETTINGS },
    students: INITIAL_STUDENTS.map((s) => ({ ...s })),
    teachers: INITIAL_TEACHERS.map((t) => ({ ...t })),
    groups: INITIAL_GROUPS.map((g) => ({ ...g })),
    subjects: INITIAL_SUBJECTS.map((s) => ({ ...s })),
    lessons: INITIAL_LESSONS.map((l) => ({ ...l })),
    qrSessions: [],
    attendance: [],
    messages: [],
    audit: []
  };
}

export function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDb;
      return { ...seed(), ...parsed };
    }
  } catch {
    /* ignore */
  }
  const fresh = seed();
  saveDb(fresh);
  return fresh;
}

export function saveDb(db: LocalDb): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function mutateDb(fn: (db: LocalDb) => void): LocalDb {
  const db = loadDb();
  fn(db);
  saveDb(db);
  return db;
}
