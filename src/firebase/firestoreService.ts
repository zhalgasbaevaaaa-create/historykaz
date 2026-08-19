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
import { loadDb, mutateDb } from './localDb';

export async function initializeDatabaseIfEmpty(): Promise<void> {
  loadDb();
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return loadDb().settings;
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  mutateDb((db) => {
    db.settings = { ...db.settings, ...settings };
  });
}

export async function getStudentByEmail(email: string): Promise<Student | null> {
  const normalized = email.trim().toLowerCase();
  return loadDb().students.find((s) => s.googleEmail.toLowerCase() === normalized) || null;
}

export async function getAllStudents(): Promise<Student[]> {
  return loadDb().students;
}

export async function saveStudent(student: Student): Promise<void> {
  mutateDb((db) => {
    const i = db.students.findIndex((s) => s.studentId === student.studentId);
    if (i >= 0) db.students[i] = student;
    else db.students.push(student);
  });
}

export async function deleteStudent(studentId: string): Promise<void> {
  mutateDb((db) => {
    db.students = db.students.filter((s) => s.studentId !== studentId);
  });
}

export async function getAllTeachers(): Promise<Teacher[]> {
  return loadDb().teachers;
}

export async function saveTeacher(teacher: Teacher): Promise<void> {
  mutateDb((db) => {
    const i = db.teachers.findIndex((t) => t.id === teacher.id);
    if (i >= 0) db.teachers[i] = teacher;
    else db.teachers.push(teacher);
  });
}

export async function deleteTeacher(teacherId: string): Promise<void> {
  mutateDb((db) => {
    db.teachers = db.teachers.filter((t) => t.id !== teacherId);
  });
}

export async function getAllGroups(): Promise<AcademicGroup[]> {
  return loadDb().groups;
}

export async function saveGroup(group: AcademicGroup): Promise<void> {
  mutateDb((db) => {
    const i = db.groups.findIndex((g) => g.id === group.id);
    if (i >= 0) db.groups[i] = group;
    else db.groups.push(group);
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  mutateDb((db) => {
    db.groups = db.groups.filter((g) => g.id !== groupId);
  });
}

export async function getAllSubjects(): Promise<Subject[]> {
  return loadDb().subjects;
}

export async function saveSubject(subject: Subject): Promise<void> {
  mutateDb((db) => {
    const i = db.subjects.findIndex((s) => s.id === subject.id);
    if (i >= 0) db.subjects[i] = subject;
    else db.subjects.push(subject);
  });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  mutateDb((db) => {
    db.subjects = db.subjects.filter((s) => s.id !== subjectId);
  });
}

export async function getAllLessons(): Promise<Lesson[]> {
  return loadDb().lessons;
}

export async function getLessonsForGroup(groupName: string): Promise<Lesson[]> {
  return loadDb().lessons.filter((l) => l.group === groupName);
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  mutateDb((db) => {
    const i = db.lessons.findIndex((l) => l.id === lesson.id);
    if (i >= 0) db.lessons[i] = lesson;
    else db.lessons.push(lesson);
  });
}

export async function deleteLesson(lessonId: string): Promise<void> {
  mutateDb((db) => {
    db.lessons = db.lessons.filter((l) => l.id !== lessonId);
  });
}

export async function createQrSession(lesson: Lesson, validitySeconds: number = 900): Promise<QrSession> {
  const now = Date.now();
  const session: QrSession = {
    sessionId: 'QRS-' + now + '-' + Math.random().toString(36).slice(2, 9),
    lessonId: lesson.id,
    teacherId: lesson.teacherId,
    teacherName: lesson.teacherName,
    subject: lesson.subject,
    group: lesson.group,
    token: 'TOK_' + Math.random().toString(36).slice(2) + '_' + now.toString(36),
    createdAt: now,
    expiresAt: now + validitySeconds * 1000,
    status: 'Active',
    totalAttendees: 0
  };

  mutateDb((db) => {
    db.qrSessions.forEach((s) => {
      if (s.lessonId === lesson.id && s.status === 'Active') s.status = 'Invalidated';
    });
    db.qrSessions.push(session);
  });
  return session;
}

export async function getActiveQrSessionForLesson(lessonId: string): Promise<QrSession | null> {
  const db = loadDb();
  const session = db.qrSessions.find((s) => s.lessonId === lessonId && s.status === 'Active');
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    mutateDb((d) => {
      const s = d.qrSessions.find((x) => x.sessionId === session.sessionId);
      if (s) s.status = 'Expired';
    });
    return { ...session, status: 'Expired' };
  }
  return session;
}

export async function invalidateQrSession(sessionId: string): Promise<void> {
  mutateDb((db) => {
    const s = db.qrSessions.find((x) => x.sessionId === sessionId);
    if (s) s.status = 'Invalidated';
  });
}

export async function getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
  return loadDb()
    .attendance.filter((a) => a.studentId === studentId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function subscribeAttendanceForLesson(
  lessonId: string,
  onUpdate: (records: AttendanceRecord[]) => void
): () => void {
  const tick = () => {
    const list = loadDb()
      .attendance.filter((a) => a.lessonId === lessonId)
      .sort((a, b) => b.timestamp - a.timestamp);
    onUpdate(list);
  };
  tick();
  const id = setInterval(tick, 1500);
  return () => clearInterval(id);
}

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  return loadDb().attendance.sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
  mutateDb((db) => {
    const i = db.attendance.findIndex((a) => a.id === record.id);
    if (i >= 0) db.attendance[i] = record;
    else db.attendance.push(record);
  });
}

export async function sendStudentMessage(
  message: Omit<StudentMessage, 'id' | 'createdAt' | 'status'>
): Promise<void> {
  const full: StudentMessage = {
    ...message,
    id: 'MSG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    status: 'Sent'
  };
  mutateDb((db) => {
    db.messages.push(full);
  });
}

export async function getMessagesForTeacher(_teacherId?: string): Promise<StudentMessage[]> {
  return loadDb().messages.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getMessagesForStudent(studentId: string): Promise<StudentMessage[]> {
  return loadDb()
    .messages.filter((m) => m.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteMessage(messageId: string): Promise<void> {
  mutateDb((db) => {
    db.messages = db.messages.filter((m) => m.id !== messageId);
  });
}

export async function deleteAllMessagesForTeacher(_teacherId?: string): Promise<void> {
  mutateDb((db) => {
    db.messages = [];
  });
}

export async function replyToMessage(messageId: string, replyText: string): Promise<void> {
  mutateDb((db) => {
    const m = db.messages.find((x) => x.id === messageId);
    if (m) {
      m.status = 'Replied';
      m.replyText = replyText;
      m.repliedAt = new Date().toISOString();
    }
  });
}

export async function logAuditEvent(
  action: string,
  userEmail: string,
  role: string,
  details: string
): Promise<void> {
  mutateDb((db) => {
    db.audit.push({
      id: 'LOG-' + Date.now(),
      action,
      userEmail,
      role,
      details,
      timestamp: new Date().toISOString()
    });
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return loadDb().audit.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
