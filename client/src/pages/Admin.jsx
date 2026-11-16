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

function ResultsAdmin({ onLogout }) {
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
      const saved = await api.adminSave(form.id, fd); setMsg((form.id ? 'Result updated.' : 'Result published.') + (saved.type === 'sheet' ? ` ${saved.rowCount.toLocaleString()} students loaded from the Excel file.` : '')); reset(); load();
    } catch (x) { if (x.status === 401) onLogout(); else setErr(x.message); }
    setBusy(false);
  };
  const del = async (r) => { if (!window.confirm(`Delete “${r.title}”? The uploaded file will be removed too.`)) return; try { await api.adminDelete(r.id); load(); } catch (x) { setErr(x.message); } };
  return (
    <>
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
                <td>{r.type === 'sheet' ? `Excel · ${(r.rowCount || 0).toLocaleString()} students` : r.type}</td><td>{r.isPublished ? 'Live' : 'Hidden'}</td>
                <td className="c-link act"><button className="show" onClick={() => edit(r)}>Edit</button> <button className="show danger" onClick={() => del(r)}>Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </>
  );
}
const SECTION_LABEL = { 'director-evaluation': 'Director of Evaluation', controller: 'Controller of Examinations', 'additional-controllers': 'Additional Controller of Examinations' };
const blankO = { id: null, section: 'director-evaluation', name: '', designation: '', order: 0, photo: null, removePhoto: false, current: '' };
function OfficialsAdmin({ onLogout }) {
  const [items, setItems] = useState(null), [form, setForm] = useState(blankO), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [fk, setFk] = useState(0);
  const load = useCallback(() => api.adminOfficials().then((d) => setItems(d.items)).catch((e) => { if (e.status === 401) onLogout(); else setErr(e.message); }), [onLogout]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const reset = () => { setForm(blankO); setFk((k) => k + 1); };
  const edit = (o) => { setForm({ id: o.id, section: o.section, name: o.name, designation: o.designation || '', order: o.order || 0, photo: null, removePhoto: false, current: o.photo ? 'has photo' : '' }); setMsg(''); setErr(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setMsg('');
    try {
      const fd = new FormData();
      ['section', 'name', 'designation', 'order'].forEach((k) => fd.append(k, form[k]));
      if (form.photo) fd.append('photo', form.photo); else if (form.removePhoto) fd.append('removePhoto', 'true');
      await api.adminOfficialSave(form.id, fd); setMsg(form.id ? 'Updated.' : 'Added.'); reset(); load();
    } catch (x) { if (x.status === 401) onLogout(); else setErr(x.message); }
    setBusy(false);
  };
  const del = async (o) => { if (!window.confirm(`Delete “${o.name}”?`)) return; try { await api.adminOfficialDelete(o.id); load(); } catch (x) { setErr(x.message); } };
  return (
    <>
      <form className="card pad form" onSubmit={save}>
        <h3>{form.id ? 'Edit person' : 'Add a person'}</h3>
        <div className="row2">
          <label>Page<select value={form.section} onChange={set('section')}>{Object.entries(SECTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Order (1 shows first)<input type="number" value={form.order} onChange={set('order')} /></label>
        </div>
        <label>Name<input value={form.name} onChange={set('name')} required maxLength={200} placeholder="Prof. Name Surname" /></label>
        <label>Designation<input value={form.designation} onChange={set('designation')} maxLength={300} placeholder="e.g. Professor of CSE" /></label>
        <label>Photo (PNG, JPG or WebP, max 5 MB; used on the Director and Controller pages)<input key={fk} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm({ ...form, photo: e.target.files[0] || null })} /></label>
        {form.id && form.current && !form.photo && <label className="chk"><input type="checkbox" checked={form.removePhoto} onChange={(e) => setForm({ ...form, removePhoto: e.target.checked })} /> Remove the current photo</label>}
        {err && <p className="err">{err}</p>}{msg && <p className="ok">{msg}</p>}
        <div className="btns"><button className="btn" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Add'}</button>{form.id && <button type="button" className="show" onClick={reset}>Cancel edit</button>}</div>
      </form>
      <div className="card" style={{ marginTop: 24 }}>
        <table className="tbl">
          <thead><tr><th>Page</th><th>Name</th><th>Designation</th><th className="c-link">Actions</th></tr></thead>
          <tbody>
            {!items && <tr><td colSpan="4" className="empty">Loading…</td></tr>}
            {items && items.length === 0 && <tr><td colSpan="4" className="empty">Nobody added yet.</td></tr>}
            {items && items.map((o) => <tr key={o.id}><td>{SECTION_LABEL[o.section]}</td><td>{o.name}{o.photo && <span className="note" style={{ margin: '0 0 0 8px' }}>· photo</span>}</td><td>{o.designation}</td>
              <td className="c-link act"><button className="show" onClick={() => edit(o)}>Edit</button> <button className="show danger" onClick={() => del(o)}>Delete</button></td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('results');
  return (
    <section className="wrap">
      <div className="sec-head"><span className="bar" /><h2>Admin</h2></div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'results'} className={tab === 'results' ? 'on' : ''} onClick={() => setTab('results')}>Results</button>
        <button role="tab" aria-selected={tab === 'officials'} className={tab === 'officials' ? 'on' : ''} onClick={() => setTab('officials')}>About Us people</button>
        <button className="show" style={{ marginLeft: 'auto' }} onClick={onLogout}>Log out</button>
      </div>
      {tab === 'results' ? <ResultsAdmin onLogout={onLogout} embedded /> : <OfficialsAdmin onLogout={onLogout} />}
    </section>
  );
}
export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());
  const out = useCallback(() => { setToken(null); setAuthed(false); }, []);
  return authed ? <Dashboard onLogout={out} /> : <Login onDone={() => setAuthed(true)} />;
}
