async function apiRequest(path, options = {}) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

async function fetchMe() {
  return apiRequest("/api/auth/me");
}

async function login(username, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

async function logout() {
  return apiRequest("/api/auth/logout", { method: "POST" });
}

async function submitIssue(name, body) {
  return apiRequest("/api/issues", {
    method: "POST",
    body: JSON.stringify({ name, body }),
  });
}

async function fetchAllIssues() {
  return apiRequest("/api/issues");
}

async function resolveIssue(id, action) {
  return apiRequest(`/api/issues/${id}/${action}`, { method: "POST" });
}

function formatWhen(iso) {
  return new Date(iso).toLocaleString();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
