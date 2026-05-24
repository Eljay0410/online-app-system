export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

const AUTH_TOKEN_KEY = "oas_token";
const inFlightGetRequests = new Map();

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;
  const canDedupe =
    method === "GET" &&
    !hasBody &&
    !options.signal &&
    options.dedupe !== false;
  const dedupeKey = `${method}:${path}`;

  if (canDedupe && inFlightGetRequests.has(dedupeKey)) {
    return inFlightGetRequests.get(dedupeKey);
  }

  const requestPromise = performApiRequest(path, options, hasBody);

  if (canDedupe) {
    inFlightGetRequests.set(dedupeKey, requestPromise);
    requestPromise.then(
      () => inFlightGetRequests.delete(dedupeKey),
      () => inFlightGetRequests.delete(dedupeKey)
    );
  }

  return requestPromise;
}

async function performApiRequest(path, options, hasBody) {
  let response;
  const authToken = getAuthToken();
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
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

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
