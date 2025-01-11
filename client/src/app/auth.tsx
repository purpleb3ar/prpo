import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

interface UserData {
  username: string;
  id: string;
}

interface AuthContextType {
  user: UserData | null;
  checkAuth(): Promise<void>;
  logout(): void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// const CHECK_AUTH_ROUTE = "http://localhost:9000/users/me";
// const LOGOUT_ROUTE = "http://localhost:9000/auth/logout";

const CHECK_AUTH_ROUTE = "https://prpo.purplebear.io/users/me";
const LOGOUT_ROUTE = "https://prpo.purplebear.io/auth/logout";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(CHECK_AUTH_ROUTE, {
        credentials: "include",
        method: "GET",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(LOGOUT_ROUTE, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
