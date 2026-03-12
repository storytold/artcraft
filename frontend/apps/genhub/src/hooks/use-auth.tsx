import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersApi, type UserInfo } from '@storyteller/api';

interface AuthContextValue {
  user: UserInfo | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const api = new UsersApi();

function dispatchAuthChange() {
  window.dispatchEvent(new Event('auth-change'));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await api.GetSession();
      if (res.success && res.data?.loggedIn && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    const handler = () => checkSession();
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, [checkSession]);

  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<string | null> => {
      const res = await api.Login({ usernameOrEmail, password });
      if (res.success) {
        dispatchAuthChange();
        return null;
      }
      return res.errorMessage ?? 'Login failed. Please try again.';
    },
    [],
  );

  const signup = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      const res = await api.Signup({
        username,
        email,
        password,
        passwordConfirmation: password,
        signupSource: 'genhub',
      });
      if (res.success) {
        dispatchAuthChange();
        return null;
      }
      return res.errorMessage ?? 'Signup failed. Please try again.';
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.Logout();
    setUser(null);
    dispatchAuthChange();
    navigate('/');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
