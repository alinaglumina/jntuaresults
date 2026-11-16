import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, fmtDate } from '../api.js';
import Pager from '../components/Pager.jsx';

function Login({ onDone }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const go = async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { const r = await api.login(email, password); setToken(r.token); onDone(); } catch (x) { setErr(x.message); } setBusy(false); };
  return (
    <section className="wrap narrow">
      <div className="sec-head"><span className="bar" /><h2>Admin Login</h2></div>
      <form className="card pad form" onSubmit={go}>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </section>
  );
}
const today = () => new Date().toISOString().slice(0, 10);
const blank = { id: null, title: '', publishDate: today(), externalUrl: '', isPublished: true, file: null };

function Dashboard({ onLogout }) {
  const [page, setPage] = useState(1), [data, setData] = useState(null), [form, setForm] = useState(blank), [msg, setMsg] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [fileKey, setFileKey] = useState(0);
  const load = useCallback(() => api.adminList(page).then(setData).catch((e) => { if (e.status === 401) onLogout(); else setErr(e.message); }), [page, onLogout]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const edit = (r) => { setForm({ id: r.id, title: r.title, publishDate: new Date(r.publishDate).toISOString().slice(0, 10), externalUrl: r.externalUrl || '', isPublished: r.isPublished, file: null, current: r.fileName }); setMsg(''); setErr(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setForm(blank); setFileKey((k) => k + 1); };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setMsg('');
    try {
      const fd = new FormData();
      fd.append('title', form.title); fd.append('publishDate', form.publishDate); fd.append('isPublished', String(form.isPublished));
      if (form.file) fd.append('file', form.file); else if (form.externalUrl) fd.append('externalUrl', form.externalUrl);
      await api.adminSave(form.id, fd); setMsg(form.id ? 'Result updated.' : 'Result published.'); reset(); load();
    } catch (x) { if (x.status === 401) onLogout(); else setErr(x.message); }
    setBusy(false);
  };
  const del = async (r) => { if (!window.confirm(`Delete “${r.title}”? The uploaded file will be removed too.`)) return; try { await api.adminDelete(r.id); load(); } catch (x) { setErr(x.message); } };
  return (
    <section className="wrap">
      <div className="sec-head"><span className="bar" /><h2>Manage Results</h2></div>
      <div className="vbar"><span className="note" style={{ margin: 0 }}>Signed in as admin</span><button className="show" onClick={onLogout}>Log out</button></div>
      <form className="card pad form" onSubmit={save}>
        <h3>{form.id ? 'Edit result' : 'Add a result'}</h3>
        <label>Title<input value={form.title} onChange={set('title')} required maxLength={400} placeholder="B.Tech III Year I Semester (R23) Regular Examinations, Oct 2026" /></label>
        <div className="row2">
          <label>Publish date<input type="date" value={form.publishDate} onChange={set('publishDate')} required /></label>
          <label>File (Excel, PDF or any format, max 25 MB)<input key={fileKey} type="file" onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })} /></label>
        </div>
        {form.id && form.current && !form.file && <p className="note" style={{ margin: 0 }}>Current file: {form.current}. Choose a new file to replace it.</p>}
        <label>…or link to the result instead of a file<input type="url" value={form.externalUrl} onChange={set('externalUrl')} placeholder="https://" disabled={!!form.file} /></label>
        <label className="chk"><input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} /> Published (visible on the website)</label>
        {err && <p className="err">{err}</p>}{msg && <p className="ok">{msg}</p>}
        <div className="btns"><button className="btn" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Publish'}</button>{form.id && <button type="button" className="show" onClick={reset}>Cancel edit</button>}</div>
      </form>
      <div className="card" style={{ marginTop: 24 }}>
        <table className="tbl">
          <thead><tr><th className="c-date">Date</th><th>Title</th><th>Type</th><th>Status</th><th className="c-link">Actions</th></tr></thead>
          <tbody>
            {!data && <tr><td colSpan="5" className="empty">Loading…</td></tr>}
            {data && data.items.length === 0 && <tr><td colSpan="5" className="empty">No results yet.</td></tr>}
            {data && data.items.map((r) => (
              <tr key={r.id}><td className="c-date">{fmtDate(r.publishDate)}</td><td>{r.title}{r.fileName && <div className="note" style={{ margin: 0, textAlign: 'left' }}>{r.fileName}</div>}</td>
                <td>{r.type}</td><td>{r.isPublished ? 'Live' : 'Hidden'}</td>
                <td className="c-link act"><button className="show" onClick={() => edit(r)}>Edit</button> <button className="show danger" onClick={() => del(r)}>Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </section>
  );
}
export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());
  const out = useCallback(() => { setToken(null); setAuthed(false); }, []);
  return authed ? <Dashboard onLogout={out} /> : <Login onDone={() => setAuthed(true)} />;
}
