import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { UserProfile, Student, UserRole, StudentStatus } from '../types';
import { getAllStudents, saveStudent, initializeDatabaseIfEmpty, logAuditEvent } from './firestoreService';
import { assertCanLogin, markLogin } from '../utils/deviceLock';
import { supabase, appRedirectUrl } from '../lib/supabase';

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

  const applyStudentRecord = async (fullName: string, email: string, photoURL: string | null) => {
    const name = fullName.trim().replace(/\s+/g, ' ') || email.split('@')[0];
    const id = slugId(email || name);
    const all = await getAllStudents();
    let student = all.find(
      (s) =>
        (email && s.googleEmail.toLowerCase() === email.toLowerCase()) ||
        s.fullName.trim().toLowerCase() === name.toLowerCase() ||
        s.studentId === id
    );
    if (!student) {
      student = {
        id,
        studentId: id,
        fullName: name,
        googleEmail: email,
        group: 'HC-2026-2027',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      await saveStudent(student);
    } else {
      student = { ...student, fullName: name, googleEmail: email || student.googleEmail, group: 'HC-2026-2027' };
      await saveStudent(student);
    }
    const user: AppUser = {
      uid: student.studentId,
      email: student.googleEmail || email,
      displayName: student.fullName,
      photoURL
    };
    setCurrentUser(user);
    setUserRole('STUDENT');
    setCurrentStudent(student);
    setStudentStatus('Active');
    setUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: student.fullName,
      photoURL: photoURL || undefined,
      role: 'STUDENT',
      studentId: student.studentId,
      group: 'HC-2026-2027',
      createdAt: student.createdAt,
      lastLoginAt: new Date().toISOString()
    });
    localStorage.setItem(
      STUDENT_SESSION,
      JSON.stringify({ fullName: student.fullName, email: user.email, photoURL })
    );
    localStorage.removeItem(TEACHER_SESSION);
    logAuditEvent('STUDENT_LOGIN', user.email || student.fullName, 'STUDENT', 'Кіру');
  };

  const applyGoogleUser = async (su: SupabaseUser) => {
    const meta = su.user_metadata || {};
    const email = (su.email || '').toLowerCase();
    const name = String(meta.full_name || meta.name || email.split('@')[0] || 'Студент');
    const photo = (meta.avatar_url || meta.picture || null) as string | null;
    await applyStudentRecord(name, email, photo);
  };

  useEffect(() => {
    const boot = async () => {
      await initializeDatabaseIfEmpty().catch(console.warn);

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const hadLocal = !!localStorage.getItem(STUDENT_SESSION);
        try {
          if (!hadLocal) assertCanLogin();
          await applyGoogleUser(data.session.user);
          if (!hadLocal) markLogin();
        } catch (err: any) {
          await supabase.auth.signOut();
          localStorage.removeItem(STUDENT_SESSION);
          setLoading(false);
          return;
        }
        setLoading(false);
        return;
      }

      if (localStorage.getItem(TEACHER_SESSION) === '1') {
        applyTeacher();
        setLoading(false);
        return;
      }
      try {
        const saved = localStorage.getItem(STUDENT_SESSION);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) await applyStudentRecord(parsed.fullName, parsed.email || '', parsed.photoURL || null);
        }
      } catch {
        localStorage.removeItem(STUDENT_SESSION);
      }
      setLoading(false);
    };
    boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          if (!localStorage.getItem(STUDENT_SESSION)) {
            assertCanLogin();
            await applyGoogleUser(session.user);
            markLogin();
          }
        } catch {
          await supabase.auth.signOut();
        }
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    localStorage.removeItem(TEACHER_SESSION);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: appRedirectUrl(),
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) {
      throw new Error(error.message || 'Google арқылы кіру мүмкін болмады. Қайталап көріңіз.');
    }
  };

  const signInStudent = async (fullName: string, accessCode: string) => {
    if (accessCode.trim() !== STUDENT_ACCESS_CODE) {
      throw new Error('Қате доступ');
    }
    if (fullName.trim().length < 3) {
      throw new Error('Аты-жөніңізді толық жазыңыз');
    }
    assertCanLogin();
    await applyStudentRecord(fullName, '', null);
    markLogin();
  };

  const signInTeacher = async (password: string) => {
    if (password !== TEACHER_PASSWORD) {
      throw new Error('Қате құпиясөз');
    }
    await supabase.auth.signOut().catch(() => undefined);
    applyTeacher();
    logAuditEvent('TEACHER_LOGIN', 'zhalgasbaevaaaa@gmail.com', 'TEACHER', 'Оқытушы кірді');
  };

  const signOut = async () => {
    localStorage.removeItem(TEACHER_SESSION);
    localStorage.removeItem(STUDENT_SESSION);
    await supabase.auth.signOut().catch(() => undefined);
    setCurrentUser(null);
    setUserProfile(null);
    setCurrentStudent(null);
    setStudentStatus('Unknown');
    setUserRole('STUDENT');
  };

  const switchRoleForTesting = (_role: UserRole) => {};

  const refreshStudentData = async () => {
    if (currentStudent?.fullName) {
      await applyStudentRecord(currentStudent.fullName, currentStudent.googleEmail || '', currentUser?.photoURL || null);
    }
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
