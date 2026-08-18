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
  initializeDatabaseIfEmpty,
  logAuditEvent
} from './firestoreService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  currentStudent: Student | null;
  userRole: UserRole;
  studentStatus: StudentStatus | 'Unknown' | 'NotFound';
  loading: boolean;
  isAuthorized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchRoleForTesting: (role: UserRole) => void;
  refreshStudentData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Super Admin emails that always have full administrative privileges
const SUPER_ADMIN_EMAILS = [
  'akonyaalex@gmail.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [studentStatus, setStudentStatus] = useState<StudentStatus | 'Unknown' | 'NotFound'>('Unknown');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize seed database once on mount
  useEffect(() => {
    initializeDatabaseIfEmpty().catch(console.warn);
  }, []);

  const checkUserAuthorization = async (user: User) => {
    try {
      const email = (user.email || '').toLowerCase().trim();
      const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(email);

      // Check if email belongs to authorized student roster
      const studentRecord = await getStudentByEmail(email);

      let detectedRole: UserRole = 'STUDENT';
      if (isSuperAdminEmail) {
        detectedRole = 'SUPER_ADMIN';
      }

      if (studentRecord) {
        setCurrentStudent(studentRecord);
        setStudentStatus(studentRecord.status);
      } else if (isSuperAdminEmail) {
        // Admin test fallback student record so admin can also test QR scanning seamlessly
        setCurrentStudent({
          id: 'ST-ADMIN-001',
          studentId: 'ST-2026-001',
          fullName: user.displayName || 'Ахметов Айбек (Админ)',
          googleEmail: email,
          group: 'CS-2101',
          status: 'Active',
          createdAt: new Date().toISOString()
        });
        setStudentStatus('Active');
      } else {
        setCurrentStudent(null);
        setStudentStatus('NotFound');
      }

      setUserRole(detectedRole);

      const profile: UserProfile = {
        uid: user.uid,
        email: email,
        displayName: user.displayName || 'Қолданушы',
        photoURL: user.photoURL || undefined,
        role: detectedRole,
        studentId: studentRecord?.studentId || (isSuperAdminEmail ? 'ST-2026-001' : undefined),
        group: studentRecord?.group || (isSuperAdminEmail ? 'CS-2101' : undefined),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      setUserProfile(profile);

      // Log successful login audit
      logAuditEvent(
        'GOOGLE_LOGIN',
        email,
        detectedRole,
        `Кіру сәтті өтті: ${studentRecord ? studentRecord.status : (isSuperAdminEmail ? 'Super Admin' : 'Табылмады')}`
      );
    } catch (error) {
      console.error('Error during authorization check:', error);
      setStudentStatus('NotFound');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await checkUserAuthorization(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setCurrentStudent(null);
        setStudentStatus('Unknown');
        setUserRole('STUDENT');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await checkUserAuthorization(result.user);
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    if (currentUser?.email) {
      logAuditEvent('LOGOUT', currentUser.email, userRole, 'Жүйеден шығу');
    }
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setCurrentStudent(null);
    setStudentStatus('Unknown');
    setUserRole('STUDENT');
  };

  const switchRoleForTesting = (role: UserRole) => {
    setUserRole(role);
  };

  const refreshStudentData = async () => {
    if (currentUser?.email) {
      await checkUserAuthorization(currentUser);
    }
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
