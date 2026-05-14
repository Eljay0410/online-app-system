import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AUTH_STORAGE_KEY = "oas_user";
const AUTH_TOKEN_KEY = "oas_token";

export const roleHomePaths = {
  applicant: "/applications",
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
  try {
    const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return "";
  }
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading] = useState(false);

  const login = useCallback((userData, userToken) => {
    const normalizedUser = {
      ...userData,
      role: normalizeRole(userData?.role),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(AUTH_TOKEN_KEY, userToken);
    setUser(normalizedUser);
    setToken(userToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setToken("");
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

export function storeUser(user, token = "") {
  const normalizedUser = {
    ...user,
    role: normalizeRole(user?.role),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  return normalizedUser;
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getRoleHomePath(role) {
  return roleHomePaths[normalizeRole(role)] || "/login";
}

export function getAuthenticatedHomePath(user) {
  if (!user) return "/login";

  const role = normalizeRole(user.role);

  if (role === "applicant" && user.profileComplete === false) {
    return "/profile";
  }

  return getRoleHomePath(role);
}
