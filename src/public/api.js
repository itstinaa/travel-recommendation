function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function clearToken() {
  localStorage.removeItem("token");
}

function requireAuthOrRedirect() {
  const token = getToken();
  if (!token) {
    window.location.href = "/login.html";
  }
}

async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (options.auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!response.ok) {
    console.error("API ERROR:", {
      path,
      status: response.status,
      data
    });

    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}