import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Student, UserRole, StudentStatus } from '../types';
import {
  getAllStudents,
  saveStudent,
  initializeDatabaseIfEmpty,
  logAuditEvent
} from './firestoreService';
import { assertCanLogin, markLogin } from '../utils/deviceLock';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  currentStudent: Student | null;
  userRole: UserRole;
  studentStatus: StudentStatus | 'Unknown' | 'NotFound';
  loading: boolean;
  isAuthorized: boolean;
  signInWithGoogle: () => Promise<void>;
  signInStudent: (fullName: string, accessCode: string) => Promise<void>;
  signInTeacher: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchRoleForTesting: (role: UserRole) => void;
  refreshStudentData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TEACHER_SESSION = 'historykaz-teacher';
const STUDENT_SESSION = 'historykaz-student-user';
const TEACHER_PASSWORD = 'Akylbek8080@#$';
export const STUDENT_ACCESS_CODE = 'Student2026';

function slugId(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яәіңғүұқөһ0-9-]/gi, '');
  return ('ST-' + s).slice(0, 40);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [studentStatus, setStudentStatus] = useState<StudentStatus | 'Unknown' | 'NotFound'>('Unknown');
  const [loading, setLoading] = useState<boolean>(true);

  const applyTeacher = () => {
    const user: AppUser = {
      uid: 'teacher-sarsenbayev',
      email: 'zhalgasbaevaaaa@gmail.com',
      displayName: 'Профессор Сарсенбаев А.Б.',
      photoURL: null
    };
    setCurrentUser(user);
    setUserRole('TEACHER');
    setCurrentStudent(null);
    setStudentStatus('Unknown');
    setUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: 'TEACHER',
      teacherId: 'T-01',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
    localStorage.setItem(TEACHER_SESSION, '1');
    localStorage.removeItem(STUDENT_SESSION);
  };

  const applyStudent = async (fullName: string) => {
    const name = fullName.trim().replace(/\s+/g, ' ');
    const id = slugId(name);
    const all = await getAllStudents();
    let student = all.find(
      (s) => s.fullName.trim().toLowerCase() === name.toLowerCase() || s.studentId === id
    );
    if (!student) {
      student = {
        id,
        studentId: id,
        fullName: name,
        googleEmail: '',
        group: 'HC-2026-2027',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      await saveStudent(student);
    }
    const user: AppUser = {
      uid: student.studentId,
      email: student.googleEmail || '',
      displayName: student.fullName,
      photoURL: null
    };
    setCurrentUser(user);
    setUserRole('STUDENT');
    setCurrentStudent(student);
    setStudentStatus('Active');
    student.group = 'HC-2026-2027';
    setUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: student.fullName,
      role: 'STUDENT',
      studentId: student.studentId,
      group: 'HC-2026-2027',
      createdAt: student.createdAt,
      lastLoginAt: new Date().toISOString()
    });
    localStorage.setItem(STUDENT_SESSION, JSON.stringify({ fullName: student.fullName }));
    localStorage.removeItem(TEACHER_SESSION);
    logAuditEvent('STUDENT_LOGIN', student.fullName, 'STUDENT', 'Ортақ доступпен кіру');
  };

  useEffect(() => {
    const boot = async () => {
      await initializeDatabaseIfEmpty().catch(console.warn);
      if (localStorage.getItem(TEACHER_SESSION) === '1') {
        applyTeacher();
        setLoading(false);
        return;
      }
      try {
        const saved = localStorage.getItem(STUDENT_SESSION);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) await applyStudent(parsed.fullName);
        }
      } catch {
        localStorage.removeItem(STUDENT_SESSION);
      }
      setLoading(false);
    };
    boot();
  }, []);

  const signInWithGoogle = async () => {
    throw new Error('Google кіру өшірілген. Ортақ доступты пайдаланыңыз.');
  };

  const signInStudent = async (fullName: string, accessCode: string) => {
    if (accessCode.trim() !== STUDENT_ACCESS_CODE) {
      throw new Error('Қате доступ');
    }
    if (fullName.trim().length < 3) {
      throw new Error('Аты-жөніңізді толық жазыңыз');
    }
    await applyStudent(fullName);
  };

  const signInTeacher = async (password: string) => {
    if (password !== TEACHER_PASSWORD) {
      throw new Error('Қате құпиясөз');
    }
    applyTeacher();
    logAuditEvent('TEACHER_LOGIN', 'zhalgasbaevaaaa@gmail.com', 'TEACHER', 'Оқытушы кірді');
  };

  const signOut = async () => {
    localStorage.removeItem(TEACHER_SESSION);
    localStorage.removeItem(STUDENT_SESSION);
    setCurrentUser(null);
    setUserProfile(null);
    setCurrentStudent(null);
    setStudentStatus('Unknown');
    setUserRole('STUDENT');
  };

  const switchRoleForTesting = (_role: UserRole) => {};

  const refreshStudentData = async () => {
    if (currentStudent?.fullName) await applyStudent(currentStudent.fullName);
  };

  const isAuthorized = !!currentUser && (userRole === 'TEACHER' || studentStatus === 'Active');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        currentStudent,
        userRole,
        studentStatus,
        loading,
        isAuthorized,
        signInWithGoogle,
        signInStudent,
        signInTeacher,
        signOut,
        switchRoleForTesting,
        refreshStudentData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
