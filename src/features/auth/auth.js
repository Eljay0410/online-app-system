import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AUTH_STORAGE_KEY = "oas_user";
const AUTH_TOKEN_KEY = "oas_token";
const AUTH_EXPIRES_AT_KEY = "oas_token_expires_at";

export const roleHomePaths = {
  applicant: "/",
  admin: "/admin",
  superadmin: "/superadmin",
};

export function normalizeRole(role) {
  const value = String(role || "applicant").toLowerCase();
  if (value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }
  return value;
}

export function getStoredUser() {
  if (hasStoredSessionExpired()) {
    clearStoredUser();
    return null;
  }

  try {
    const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getStoredToken() {
  if (hasStoredSessionExpired()) {
    clearStoredUser();
    return "";
  }

  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return "";
  }
}

export function getStoredSessionExpiresAt() {
  try {
    return localStorage.getItem(AUTH_EXPIRES_AT_KEY) || "";
  } catch {
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    return "";
  }
}

function hasStoredSessionExpired() {
  const expiresAt = getStoredSessionExpiresAt();

  if (!expiresAt) return false;

  const expiresAtTime = Date.parse(expiresAt);

  return !Number.isFinite(expiresAtTime) || expiresAtTime <= Date.now();
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [sessionExpiresAt, setSessionExpiresAt] = useState(
    getStoredSessionExpiresAt()
  );
  const [loading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    setUser(null);
    setToken("");
    setSessionExpiresAt("");
  }, []);

  const login = useCallback((userData, userToken, tokenExpiresAt = "") => {
    const normalizedUser = {
      ...userData,
      role: normalizeRole(userData?.role),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(AUTH_TOKEN_KEY, userToken);

    if (tokenExpiresAt) {
      localStorage.setItem(AUTH_EXPIRES_AT_KEY, tokenExpiresAt);
    } else {
      localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    }

    setUser(normalizedUser);
    setToken(userToken);
    setSessionExpiresAt(tokenExpiresAt || "");
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((currentUser) => {
      const updatedUser = {
        ...currentUser,
        ...userData,
        role: normalizeRole(userData?.role || currentUser?.role),
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  useEffect(() => {
    if (!token || !sessionExpiresAt) return undefined;

    const expiresAtTime = Date.parse(sessionExpiresAt);
    const delayMs = Number.isFinite(expiresAtTime)
      ? Math.max(expiresAtTime - Date.now(), 0)
      : 0;

    const timeoutId = window.setTimeout(() => {
      logout();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login?expired=true");
      }
    }, Math.min(delayMs, 2147483647));

    return () => window.clearTimeout(timeoutId);
  }, [logout, sessionExpiresAt, token]);

  const value = useMemo(
    () => ({ user, token, login, logout, updateUser, loading }),
    [user, token, login, logout, updateUser, loading]
  );

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function storeUser(user, token = "", tokenExpiresAt = "") {
  const normalizedUser = {
    ...user,
    role: normalizeRole(user?.role),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    if (tokenExpiresAt) {
      localStorage.setItem(AUTH_EXPIRES_AT_KEY, tokenExpiresAt);
    } else {
      localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    }
  }
  return normalizedUser;
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
}

export function getRoleHomePath(role) {
  return roleHomePaths[normalizeRole(role)] || "/login";
}

export function getAuthenticatedHomePath(user) {
  if (!user) return "/login";

  const role = normalizeRole(user.role);

  return getRoleHomePath(role);
}
