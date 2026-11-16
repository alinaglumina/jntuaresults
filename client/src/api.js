const TOKEN = 'jr_token';
export const getToken = () => { try { return localStorage.getItem(TOKEN); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN); } catch { /* storage unavailable */ } };
async function req(path, { method = 'GET', body, auth } = {}) {
  const headers = {};
  if (auth) headers.Authorization = `Bearer ${getToken()}`;
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  const res = await fetch(`/api${path}`, { method, headers, body });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && auth) setToken(null);
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}
export const api = {
  results: (page, q) => req(`/results?page=${page}&limit=25${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  result: (id) => req(`/results/${id}`),
  login: (email, password) => req('/auth/login', { method: 'POST', body: { email, password } }),
  adminList: (page) => req(`/admin/results?page=${page}`, { auth: true }),
  adminSave: (id, form) => req(id ? `/admin/results/${id}` : '/admin/results', { method: id ? 'PUT' : 'POST', body: form, auth: true }),
  adminDelete: (id) => req(`/admin/results/${id}`, { method: 'DELETE', auth: true }),
};
export const fileUrl = (id) => `/api/results/${id}/file`;
export const fmtDate = (d) => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(/ /g, '-'); };
