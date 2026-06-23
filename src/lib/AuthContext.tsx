// src/lib/AuthContext.tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from './firebase';
import db from './firebase';
import { hydrateForUser, clearUserData } from '../shared/storage';

export type AccessStatus = 'approved' | 'pending' | 'blocked';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  accessStatus: AccessStatus | null;
  isAdmin: boolean;
  displayName: string | null; // ← ADICIONADO
  logout: () => Promise<void>;
  refreshAccess: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessStatus: null,
  isAdmin: false,
  displayName: null, // ← ADICIONADO
  logout: async () => {},
  refreshAccess: async () => {},
});

async function fetchUserProfile(
  uid: string
): Promise<{ accessStatus: AccessStatus; isAdmin: boolean }> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      return { accessStatus: 'pending', isAdmin: false };
    }
    const data = snap.data();
    const accessStatus: AccessStatus =
      data?.accessStatus === 'approved' ? 'approved'
      : data?.accessStatus === 'blocked' ? 'blocked'
      : 'pending';
    return { accessStatus, isAdmin: data?.role === 'admin' };
  } catch {
    return { accessStatus: 'pending', isAdmin: false };
  }
}

// ← ADICIONADO: extrai primeiro nome do displayName ou parte local do e-mail
function resolveDisplayName(user: User): string | null {
  if (user.displayName) {
    return user.displayName.split(' ')[0];
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,         setUser]         = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isAdmin,      setIsAdmin]      = useState(false);
  const prevUidRef = useRef<string | null>(null);

  async function loadProfile(uid: string) {
    const profile = await fetchUserProfile(uid);
    setAccessStatus(profile.accessStatus);
    setIsAdmin(profile.isAdmin);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      const prevUid = prevUidRef.current;

      if (!u && prevUid) {
        clearUserData(prevUid);
        setAccessStatus(null);
        setIsAdmin(false);
      }

      if (u) {
        if (u.uid !== prevUid) {
          if (prevUid && prevUid !== u.uid) clearUserData(prevUid);
          hydrateForUser(u.uid);
        }
        await loadProfile(u.uid);
      }

      prevUidRef.current = u?.uid ?? null;
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function logout() {
    if (user?.uid) clearUserData(user.uid);
    await signOut(auth);
  }

  async function refreshAccess() {
    if (user?.uid) await loadProfile(user.uid);
  }

  // ← ADICIONADO: derivado do user, sem estado próprio
  const displayName = user ? resolveDisplayName(user) : null;

  return (
    <AuthContext.Provider value={{ user, loading, accessStatus, isAdmin, displayName, logout, refreshAccess }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
