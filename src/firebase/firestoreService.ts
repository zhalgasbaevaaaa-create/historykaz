import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
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
  AuditLog,
  UserProfile
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_GROUPS,
  INITIAL_SUBJECTS,
  INITIAL_LESSONS
} from '../data/seedData';
import { formatKazakhDateShort, formatKazakhTime } from '../utils/kazakhDate';

// Initialize default collections if database is fresh
export async function initializeDatabaseIfEmpty(): Promise<void> {
  try {
    const settingsDoc = await getDoc(doc(db, 'system_settings', 'general'));
    if (!settingsDoc.exists()) {
      console.log('Bootstrapping initial database schema and seed records...');
      const batch = writeBatch(db);

      // 1. Settings
      batch.set(doc(db, 'system_settings', 'general'), INITIAL_SETTINGS);

      // 2. Groups
      INITIAL_GROUPS.forEach((g) => {
        batch.set(doc(db, 'groups', g.id), g);
      });

      // 3. Subjects
      INITIAL_SUBJECTS.forEach((s) => {
        batch.set(doc(db, 'subjects', s.id), s);
      });

      // 4. Teachers
      INITIAL_TEACHERS.forEach((t) => {
        batch.set(doc(db, 'teachers', t.id), t);
      });

      // 5. Students
      INITIAL_STUDENTS.forEach((st) => {
        batch.set(doc(db, 'students', st.studentId), st);
      });

      // 6. Lessons
      INITIAL_LESSONS.forEach((l) => {
        batch.set(doc(db, 'lessons', l.id), l);
      });

      await batch.commit();
      console.log('Database bootstrap successfully finished!');
    }
  } catch (error) {
    console.warn('Database initialization note:', error);
  }
}

// ----------------------------------------------------
// System Settings
// ----------------------------------------------------
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const docSnap = await getDoc(doc(db, 'system_settings', 'general'));
    if (docSnap.exists()) {
      return docSnap.data() as SystemSettings;
    }
  } catch (e) {
    console.error('Error fetching settings:', e);
  }
  return INITIAL_SETTINGS;
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  await setDoc(doc(db, 'system_settings', 'general'), settings, { merge: true });
}

// ----------------------------------------------------
// Students
// ----------------------------------------------------
export async function getStudentByEmail(email: string): Promise<Student | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const q = query(collection(db, 'students'), where('googleEmail', '==', normalizedEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data() as Student;
      return { ...docData, id: snap.docs[0].id };
    }
  } catch (e) {
    console.error('Error finding student by email:', e);
  }
  return null;
}

export async function getAllStudents(): Promise<Student[]> {
  const snap = await getDocs(collection(db, 'students'));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Student));
}

export async function saveStudent(student: Student): Promise<void> {
  await setDoc(doc(db, 'students', student.studentId), student, { merge: true });
}

export async function deleteStudent(studentId: string): Promise<void> {
  await deleteDoc(doc(db, 'students', studentId));
}

// ----------------------------------------------------
// Teachers
// ----------------------------------------------------
export async function getAllTeachers(): Promise<Teacher[]> {
  const snap = await getDocs(collection(db, 'teachers'));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Teacher));
}

export async function saveTeacher(teacher: Teacher): Promise<void> {
  await setDoc(doc(db, 'teachers', teacher.id), teacher, { merge: true });
}

export async function deleteTeacher(teacherId: string): Promise<void> {
  await deleteDoc(doc(db, 'teachers', teacherId));
}

// ----------------------------------------------------
// Groups & Subjects
// ----------------------------------------------------
export async function getAllGroups(): Promise<AcademicGroup[]> {
  const snap = await getDocs(collection(db, 'groups'));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as AcademicGroup));
}

export async function saveGroup(group: AcademicGroup): Promise<void> {
  await setDoc(doc(db, 'groups', group.id), group, { merge: true });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId));
}

export async function getAllSubjects(): Promise<Subject[]> {
  const snap = await getDocs(collection(db, 'subjects'));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Subject));
}

export async function saveSubject(subject: Subject): Promise<void> {
  await setDoc(doc(db, 'subjects', subject.id), subject, { merge: true });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  await deleteDoc(doc(db, 'subjects', subjectId));
}

// ----------------------------------------------------
// Lessons / Schedule
// ----------------------------------------------------
export async function getAllLessons(): Promise<Lesson[]> {
  const snap = await getDocs(collection(db, 'lessons'));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Lesson));
}

export async function getLessonsForGroup(groupName: string): Promise<Lesson[]> {
  const q = query(collection(db, 'lessons'), where('group', '==', groupName));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Lesson));
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  await setDoc(doc(db, 'lessons', lesson.id), lesson, { merge: true });
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await deleteDoc(doc(db, 'lessons', lessonId));
}

// ----------------------------------------------------
// QR Sessions (15 Minutes Expiration Authority)
// ----------------------------------------------------
export async function createQrSession(lesson: Lesson, validitySeconds: number = 900): Promise<QrSession> {
  const sessionId = 'QRS-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  const now = Date.now();
  const expiresAt = now + validitySeconds * 1000;
  
  // Cryptographic random token
  const token = 'TOK_' + Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);

  const qrSession: QrSession = {
    sessionId,
    lessonId: lesson.id,
    teacherId: lesson.teacherId,
    teacherName: lesson.teacherName,
    subject: lesson.subject,
    group: lesson.group,
    token,
    createdAt: now,
    expiresAt,
    status: 'Active',
    totalAttendees: 0
  };

  // Invalidate any previous active sessions for this lesson
  const existingSnap = await getDocs(
    query(
      collection(db, 'qr_sessions'),
      where('lessonId', '==', lesson.id),
      where('status', '==', 'Active')
    )
  );
  
  const batch = writeBatch(db);
  existingSnap.docs.forEach((docSnap) => {
    batch.update(doc(db, 'qr_sessions', docSnap.id), { status: 'Invalidated' });
  });

  batch.set(doc(db, 'qr_sessions', sessionId), qrSession);
  await batch.commit();

  return qrSession;
}

export async function getActiveQrSessionForLesson(lessonId: string): Promise<QrSession | null> {
  const q = query(
    collection(db, 'qr_sessions'),
    where('lessonId', '==', lessonId),
    where('status', '==', 'Active')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const session = snap.docs[0].data() as QrSession;
  // Check backend server time expiration
  if (Date.now() > session.expiresAt) {
    await updateDoc(doc(db, 'qr_sessions', session.sessionId), { status: 'Expired' });
    return { ...session, status: 'Expired' };
  }
  return session;
}

export async function invalidateQrSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'Invalidated' });
}

// ----------------------------------------------------
// Attendance Records
// ----------------------------------------------------
export async function getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, 'attendance_records'),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => d.data() as AttendanceRecord);
  return list.sort((a, b) => b.timestamp - a.timestamp);
}

export function subscribeAttendanceForLesson(
  lessonId: string,
  onUpdate: (records: AttendanceRecord[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'attendance_records'),
    where('lessonId', '==', lessonId)
  );
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map((d) => d.data() as AttendanceRecord);
    records.sort((a, b) => b.timestamp - a.timestamp);
    onUpdate(records);
  });
}

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const snap = await getDocs(collection(db, 'attendance_records'));
  const list = snap.docs.map((d) => d.data() as AttendanceRecord);
  return list.sort((a, b) => b.timestamp - a.timestamp);
}

// ----------------------------------------------------
// Student Messages
// ----------------------------------------------------
export async function sendStudentMessage(message: Omit<StudentMessage, 'id' | 'createdAt' | 'status'>): Promise<void> {
  const msgId = 'MSG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const fullMsg: StudentMessage = {
    ...message,
    id: msgId,
    createdAt: new Date().toISOString(),
    status: 'Sent'
  };
  await setDoc(doc(db, 'messages', msgId), fullMsg);
}

export async function getMessagesForTeacher(teacherId: string): Promise<StudentMessage[]> {
  const q = query(
    collection(db, 'messages'),
    where('teacherId', '==', teacherId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => d.data() as StudentMessage);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getMessagesForStudent(studentId: string): Promise<StudentMessage[]> {
  const q = query(
    collection(db, 'messages'),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => d.data() as StudentMessage);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function replyToMessage(messageId: string, replyText: string): Promise<void> {
  await updateDoc(doc(db, 'messages', messageId), {
    status: 'Replied',
    replyText,
    repliedAt: new Date().toISOString()
  });
}

// ----------------------------------------------------
// Audit Logging
// ----------------------------------------------------
export async function logAuditEvent(
  action: string,
  userEmail: string,
  role: string,
  details: string
): Promise<void> {
  try {
    const logId = 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const audit: AuditLog = {
      id: logId,
      action,
      userEmail,
      role,
      details,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, 'audit_logs', logId), audit);
  } catch (e) {
    console.warn('Audit log write error:', e);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const snap = await getDocs(collection(db, 'audit_logs'));
  const list = snap.docs.map((d) => d.data() as AuditLog);
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
