import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { UserProfile, Student, UserRole, StudentStatus } from '../types';
import {
  getStudentByEmail,
  saveStudent,
  initializeDatabaseIfEmpty,
  logAuditEvent
} from './firestoreService';

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
const TEACHER_PASSWORD = 'Akylbek8080@#$';

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Студент',
    photoURL: user.photoURL
  };
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
  };

  const registerGoogleStudent = async (user: AppUser) => {
    const email = user.email.toLowerCase().trim();
    let student = await getStudentByEmail(email);
    if (!student) {
      student = {
        id: 'ST-' + user.uid.slice(0, 8),
        studentId: 'ST-' + user.uid.slice(0, 8),
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
    logAuditEvent('GOOGLE_LOGIN', email, 'STUDENT', 'Google арқылы кіру');
  };

  useEffect(() => {
    initializeDatabaseIfEmpty().catch(console.warn);

    if (localStorage.getItem(TEACHER_SESSION) === '1') {
      applyTeacher();
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        await registerGoogleStudent(toAppUser(user));
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setCurrentStudent(null);
        setStudentStatus('Unknown');
        setUserRole('STUDENT');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    localStorage.removeItem(TEACHER_SESSION);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await registerGoogleStudent(toAppUser(result.user));
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      setLoading(false);
      throw error;
    }
    setLoading(false);
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
    try {
      await firebaseSignOut(auth);
    } catch {
      /* ignore */
    }
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
