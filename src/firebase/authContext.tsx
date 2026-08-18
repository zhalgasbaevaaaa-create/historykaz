import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Student, UserRole, StudentStatus } from '../types';
import {
  getStudentByEmail,
  saveStudent,
  initializeDatabaseIfEmpty,
  logAuditEvent
} from './firestoreService';
import { consumeGoogleRedirect, startGoogleRedirect, type GoogleProfile } from './googleAuth';

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
  signInTeacher: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchRoleForTesting: (role: UserRole) => void;
  refreshStudentData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TEACHER_SESSION = 'historykaz-teacher';
const STUDENT_SESSION = 'historykaz-google-user';
const TEACHER_PASSWORD = 'Akylbek8080@#$';

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

  const registerGoogleStudent = async (user: AppUser) => {
    const email = user.email.toLowerCase().trim();
    let student = await getStudentByEmail(email);
    if (!student) {
      student = {
        id: 'ST-' + user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10),
        studentId: 'ST-' + user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10),
        fullName: user.displayName || email.split('@')[0],
        googleEmail: email,
        group: '',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      await saveStudent(student);
    }
    setCurrentUser(user);
    setUserRole('STUDENT');
    setCurrentStudent(student);
    setStudentStatus('Active');
    setUserProfile({
      uid: user.uid,
      email,
      displayName: user.displayName,
      photoURL: user.photoURL || undefined,
      role: 'STUDENT',
      studentId: student.studentId,
      group: student.group,
      createdAt: student.createdAt,
      lastLoginAt: new Date().toISOString()
    });
    localStorage.setItem(STUDENT_SESSION, JSON.stringify(user));
    localStorage.removeItem(TEACHER_SESSION);
    logAuditEvent('GOOGLE_LOGIN', email, 'STUDENT', 'Google арқылы кіру');
  };

  useEffect(() => {
    const boot = async () => {
      await initializeDatabaseIfEmpty().catch(console.warn);

      const fromRedirect = consumeGoogleRedirect();
      if (fromRedirect) {
        await registerGoogleStudent(fromRedirect);
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
          await registerGoogleStudent(JSON.parse(saved) as GoogleProfile);
        }
      } catch {
        localStorage.removeItem(STUDENT_SESSION);
      }
      setLoading(false);
    };
    boot();
  }, []);

  const signInWithGoogle = async () => {
    startGoogleRedirect();
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
    if (currentUser && userRole === 'STUDENT') {
      await registerGoogleStudent(currentUser);
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
