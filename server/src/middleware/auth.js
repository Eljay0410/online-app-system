import { getUserBySessionToken } from "../services/sessionService.js";

const sessionTokenPattern = /^[a-f0-9]{64}$/i;

function readBearerToken(req) {
  const header = String(req.headers.authorization || "").trim();
  const [scheme, token, extra] = header.split(/\s+/);

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !token ||
    extra ||
    !sessionTokenPattern.test(token)
  ) {
    return "";
  }

  return token.trim();
}

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();

  if (value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }

  return value;
}

export async function requireAuth(req, res, next) {
  try {
    const token = readBearerToken(req);
    const user = await getUserBySessionToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    req.user = user;
    req.authToken = token;
    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not verify your session.",
    });
  }
}

export function requireRoles(...allowedRoles) {
  const allowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    if (!allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}
