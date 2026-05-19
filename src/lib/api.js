export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

const AUTH_TOKEN_KEY = "oas_token";

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  const authToken = getAuthToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    Accept: "application/json",
    ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend server. Please make sure the API is running."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (response.status === 401) {
    // Session expired or invalid
    localStorage.removeItem("oas_user");
    localStorage.removeItem("oas_token");
    if (!path.includes("/auth/login")) {
      window.location.replace("/login?expired=true");
    }
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed. Please try again.");
  }

  return payload;
}
