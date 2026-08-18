export type UserRole = 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT';

export type StudentStatus = 'Active' | 'Inactive' | 'Blocked';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  studentId?: string;
  teacherId?: string;
  group?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Student {
  id: string; // Document ID or studentId
  studentId: string; // e.g. "ST-2026-001"
  fullName: string;
  googleEmail: string;
  group: string; // e.g. "CS-2101"
  status: StudentStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  teacherId: string; // e.g. "T-01"
  fullName: string;
  email: string;
  department: string;
  phone?: string;
  status: 'Active' | 'Inactive';
}

export interface AcademicGroup {
  id: string;
  name: string; // e.g. "CS-2101"
  faculty: string;
  courseYear: number;
  studentCount?: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string; // e.g. "Қазақстан тарихы"
  credits: number;
}

export interface Lesson {
  id: string;
  lessonId: string;
  date: string; // "YYYY-MM-DD" or "18.08.2026"
  startTime: string; // "09:00"
  endTime: string; // "09:50"
  subject: string;
  teacherId: string;
  teacherName: string;
  classroom: string;
  group: string;
  isActive: boolean;
  notes?: string;
}

export interface QrSession {
  sessionId: string;
  lessonId: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  group: string;
  token: string; // Cryptographic nonce
  signature?: string;
  createdAt: number; // Server timestamp ms
  expiresAt: number; // Exactly +15 minutes (900,000 ms)
  status: 'Active' | 'Expired' | 'Invalidated';
  totalAttendees: number;
}

export interface AttendanceRecord {
  id: string; // ${lessonId}_${studentId}
  lessonId: string;
  sessionId: string;
  qrToken: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  group: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  date: string; // "18.08.2026"
  time: string; // "09:14:32"
  timestamp: number;
  status: 'Present' | 'Қатысты';
  sheetsSyncStatus: 'Synced' | 'Pending' | 'Failed';
  sheetsSyncedAt?: string | null;
  syncError?: string;
}

export interface StudentMessage {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  group: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'Sent' | 'Read' | 'Replied';
  replyText?: string;
  repliedAt?: string;
}

export interface SystemSettings {
  appName: string;
  googleSpreadsheetId: string;
  additionalAssignmentUrl: string;
  qrValiditySeconds: number;
  allowAutoSheetSync: boolean;
  institutionName: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userEmail: string;
  role: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface AttendanceValidationRequest {
  qrDataString: string;
  studentEmail: string;
  studentUid: string;
}

export interface AttendanceValidationResponse {
  success: boolean;
  message: string;
  errorReason?: string;
  attendanceRecord?: AttendanceRecord;
}
