import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  logout as logoutRequest,
  type LoginCredentials,
  type User,
} from "@/api/auth";
import { clearAuthTokens, getAccessToken } from "@/lib/authTokens";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }

    try {
      const profile = await getMe();
      setUser(profile);
    } catch {
      clearAuthTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void restoreSession().finally(() => {
      setIsLoading(false);
    });
  }, [restoreSession]);

  useEffect(() => {
    function handleAuthLogout() {
      setUser(null);
    }

    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    await loginRequest(credentials);
    const profile = await getMe();
    setUser(profile);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    await loginWithGoogleRequest(idToken);
    const profile = await getMe();
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, isLoading, login, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
