const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4001";

export async function apiPost(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

export async function apiGet(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  return res.json();
}

export async function uploadFile(file, token) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: fd,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  return res.json();
}
