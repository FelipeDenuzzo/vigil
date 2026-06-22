// src/lib/AuthContext.tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { hydrateForUser, clearUserData } from '../shared/storage';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      const prevUid = prevUidRef.current;

      if (!u && prevUid) {
        // Usuário fez logout — limpa os dados locais do uid anterior
        clearUserData(prevUid);
      }

      if (u && u.uid !== prevUid) {
        // Novo usuário autenticado (login ou troca de conta)
        // Limpa dados do anterior (se existia) e hidrata os do novo
        if (prevUid && prevUid !== u.uid) clearUserData(prevUid);
        hydrateForUser(u.uid);
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

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
