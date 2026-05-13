const AUTH_STORAGE_KEY = "oas_user";

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

export function storeUser(user) {
  const normalizedUser = {
    ...user,
    role: normalizeRole(user?.role),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedUser));
  return normalizedUser;
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getRoleHomePath(role) {
  return roleHomePaths[normalizeRole(role)] || "/login";
}
