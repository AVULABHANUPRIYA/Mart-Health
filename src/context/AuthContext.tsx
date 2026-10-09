import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleAuthProvider, db } from '../firebase/config';
import { firestoreService } from '../firebase/firestoreService';
import { User, UserRole } from '../types';
import { SEED_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: User;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  authError: string | null;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isStaff: boolean;
  isAdmin: boolean;
  availableUsers: User[];
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('mart_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return SEED_USERS[0]; // Default demo profile: Patient
  });

  // Track Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsLoading(false);

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          let resolvedRole: UserRole = 'HOSPITAL_ADMIN';
          // Check if admin email
          if (user.email === 'sathvikachennappagari@gmail.com') {
            resolvedRole = 'HOSPITAL_ADMIN';
          } else {
            resolvedRole = (currentUser.role as UserRole) || 'PATIENT';
          }

          if (userSnap.exists()) {
            const data = userSnap.data();
            const syncedUser: User = {
              id: user.uid,
              name: data.name || user.displayName || 'Authorized User',
              email: user.email || data.email || '',
              phone: data.phone || '+91 98490 12345',
              role: (data.role as UserRole) || resolvedRole,
              language: data.language || 'en',
              avatarUrl: user.photoURL || undefined,
              hospitalId: data.hospitalId || 'hosp-1',
              departmentId: data.departmentId || 'dept-emergency',
            };
            setCurrentUser(syncedUser);
          } else {
            // Initialize new user in Firestore
            const newUser: User = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Authorized User',
              email: user.email || '',
              phone: '+91 98490 12345',
              role: resolvedRole,
              language: 'en',
              avatarUrl: user.photoURL || undefined,
              hospitalId: 'hosp-1',
              departmentId: 'dept-emergency',
            };
            await setDoc(userDocRef, {
              ...newUser,
              createdAt: new Date().toISOString(),
            });
            setCurrentUser(newUser);
          }
        } catch (err) {
          console.warn('Firebase user profile sync notice:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save current user to localStorage for offline resilience
  useEffect(() => {
    localStorage.setItem('mart_user', JSON.stringify(currentUser));
    firestoreService.syncUserToFirestore(currentUser);
  }, [currentUser]);

  const switchRole = async (role: UserRole) => {
    const matched = SEED_USERS.find((u) => u.role === role);
    const updatedUser: User = matched
      ? {
          ...matched,
          id: firebaseUser ? firebaseUser.uid : matched.id,
          email: firebaseUser?.email || matched.email,
        }
      : {
          ...currentUser,
          role,
        };

    setCurrentUser(updatedUser);

    // If signed into Firebase, update role in Firestore users collection
    if (firebaseUser) {
      try {
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          { role, lastRoleSwitchedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore role update notice:', err);
      }
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      const role: UserRole =
        user.email === 'sathvikachennappagari@gmail.com' ? 'HOSPITAL_ADMIN' : 'DOCTOR';

      const appUser: User = {
        id: user.uid,
        name: user.displayName || 'Google Healthcare User',
        email: user.email || '',
        phone: '+91 98490 12345',
        role: userSnap.exists() ? (userSnap.data().role as UserRole) : role,
        language: 'en',
        avatarUrl: user.photoURL || undefined,
        hospitalId: 'hosp-1',
      };

      await setDoc(userDocRef, appUser, { merge: true });
      setCurrentUser(appUser);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-in failed';
      console.error('Google Sign-In Error:', err);
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, targetRole?: UserRole): Promise<boolean> => {
    const matched = SEED_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() || (targetRole && u.role === targetRole)
    );
    if (matched) {
      setCurrentUser(matched);
      return true;
    }

    const newUser: User = {
      id: `usr-custom-${Date.now()}`,
      name: email.split('@')[0],
      email,
      phone: '+91 90000 00000',
      role: targetRole || 'PATIENT',
      language: 'en',
    };
    setCurrentUser(newUser);
    return true;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut notice:', err);
    }
    setCurrentUser(SEED_USERS[0]); // Reset to default patient view
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(currentUser.role);
  };

  const isStaff = ['DOCTOR', 'NURSE', 'HOSPITAL_ADMIN', 'BLOOD_COORDINATOR', 'PLATFORM_ADMIN'].includes(
    currentUser.role
  );
  const isAdmin = ['HOSPITAL_ADMIN', 'PLATFORM_ADMIN'].includes(currentUser.role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isLoading,
        authError,
        setCurrentUser,
        switchRole,
        signInWithGoogle,
        login,
        logout,
        hasRole,
        isStaff,
        isAdmin,
        availableUsers: SEED_USERS,
        clearAuthError: () => setAuthError(null),
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
