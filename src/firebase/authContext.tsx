import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Student, UserRole, StudentStatus } from '../types';
import { INITIAL_STUDENTS } from '../data/seedData';
import { initializeDatabaseIfEmpty, logAuditEvent } from './firestoreService';

export interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: DemoUser | null;
  userProfile: UserProfile | null;
  currentStudent: Student | null;
  userRole: UserRole;
  studentStatus: StudentStatus | 'Unknown' | 'NotFound';
  loading: boolean;
  isAuthorized: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemo: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  switchRoleForTesting: (role: UserRole) => void;
  refreshStudentData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'historykaz-session';

const DEMO: Record<UserRole, { email: string; name: string; student: Student | null }> = {
  STUDENT: {
    email: INITIAL_STUDENTS[0].googleEmail,
    name: INITIAL_STUDENTS[0].fullName,
    student: INITIAL_STUDENTS[0]
  },
  TEACHER: {
    email: 'sarsenbayev.teacher@gmail.com',
    name: 'А. Сәрсенбаев',
    student: null
  },
  SUPER_ADMIN: {
    email: 'akonyaalex@gmail.com',
    name: 'Әкімші',
    student: INITIAL_STUDENTS[0]
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [studentStatus, setStudentStatus] = useState<StudentStatus | 'Unknown' | 'NotFound'>('Unknown');
  const [loading, setLoading] = useState<boolean>(true);

  const applySession = (role: UserRole) => {
    const demo = DEMO[role];
    const user: DemoUser = {
      uid: 'demo-' + role.toLowerCase(),
      email: demo.email,
      displayName: demo.name,
      photoURL: null
    };
    setCurrentUser(user);
    setUserRole(role);
    setCurrentStudent(demo.student);
    setStudentStatus(demo.student?.status || (role === 'SUPER_ADMIN' ? 'Active' : 'Unknown'));
    setUserProfile({
      uid: user.uid,
      email: demo.email,
      displayName: demo.name,
      role,
      studentId: demo.student?.studentId,
      group: demo.student?.group,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
    localStorage.setItem(SESSION_KEY, role);
    logAuditEvent('DEMO_LOGIN', demo.email, role, 'Демо кіру');
  };

  useEffect(() => {
    initializeDatabaseIfEmpty().catch(console.warn);
    const saved = localStorage.getItem(SESSION_KEY) as UserRole | null;
    if (saved && DEMO[saved]) {
      applySession(saved);
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    await signInDemo('STUDENT');
  };

  const signInDemo = async (role: UserRole) => {
    setLoading(true);
    applySession(role);
    setLoading(false);
  };

  const signOut = async () => {
    if (currentUser?.email) {
      logAuditEvent('LOGOUT', currentUser.email, userRole, 'Жүйеден шығу');
    }
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setUserProfile(null);
    setCurrentStudent(null);
    setStudentStatus('Unknown');
    setUserRole('STUDENT');
  };

  const switchRoleForTesting = (role: UserRole) => {
    applySession(role);
  };

  const refreshStudentData = async () => {
    if (userRole) applySession(userRole);
  };

  const isAuthorized =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'TEACHER' ||
    (userRole === 'STUDENT' && studentStatus === 'Active');

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
        signInDemo,
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
