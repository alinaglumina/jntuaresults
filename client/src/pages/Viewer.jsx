import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fileUrl } from '../api.js';
import Pager from '../components/Pager.jsx';
const PAGE = 25;
// Opens an uploaded Excel/CSV result inside the site as a searchable, paged table.
export default function Viewer() {
  const { id } = useParams();
  const [meta, setMeta] = useState(null);
  const [sheets, setSheets] = useState(null); // [{name, rows}]
  const [active, setActive] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const m = await api.result(id); if (!live) return; setMeta(m);
        const [XLSX, res] = await Promise.all([import('xlsx'), fetch(fileUrl(id))]);
        if (!res.ok) throw new Error('File not found');
        const wb = XLSX.read(await res.arrayBuffer(), { type: 'array', cellDates: true });
        const out = wb.SheetNames.map((name) => ({ name, rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '', blankrows: false }) })).filter((s) => s.rows.length);
        if (live) setSheets(out);
      } catch (e) { if (live) setErr(e.message || 'Could not open this file'); }
    })();
    return () => { live = false; };
  }, [id]);
  useEffect(() => setPage(1), [q, active]);
  const sheet = sheets?.[active];
  const head = sheet?.rows[0] || [];
  const body = useMemo(() => {
    const rows = sheet ? sheet.rows.slice(1) : [];
    const n = q.trim().toLowerCase();
    return n ? rows.filter((r) => r.some((c) => String(c).toLowerCase().includes(n))) : rows;
  }, [sheet, q]);
  const pages = Math.max(1, Math.ceil(body.length / PAGE));
  const cur = Math.min(page, pages);
  const slice = body.slice((cur - 1) * PAGE, cur * PAGE);
  const cols = Math.max(head.length, ...slice.map((r) => r.length), 1);
  return (
    <section className="wrap">
      <div className="sec-head"><span className="bar" /><h2>{meta?.title || 'Result'}</h2></div>
      <div className="vbar">
        <Link to="/" className="show">‹ Back to results</Link>
        <input className="vsearch" placeholder="Search in this result (e.g. hall ticket number)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search in result" />
        <a className="show dl" href={fileUrl(id)} download>Download file</a>
      </div>
      {sheets && sheets.length > 1 && (
        <div className="tabs" role="tablist">{sheets.map((s, i) => <button key={i} role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>{s.name}</button>)}</div>
      )}
      <div className="card xl">
        {err ? <p className="empty">{err}. You can still <a href={fileUrl(id)} download>download the file</a>.</p>
          : !sheets ? <p className="empty">Opening result…</p>
          : !sheet ? <p className="empty">This file has no data.</p>
          : (
            <table className="tbl grid">
              <thead><tr>{Array.from({ length: cols }, (_, i) => <th key={i}>{head[i] ?? ''}</th>)}</tr></thead>
              <tbody>
                {slice.length === 0 && <tr><td colSpan={cols} className="empty">No matching rows.</td></tr>}
                {slice.map((r, i) => <tr key={i}>{Array.from({ length: cols }, (_, j) => <td key={j}>{r[j] ?? ''}</td>)}</tr>)}
              </tbody>
            </table>
          )}
      </div>
      {sheet && <p className="note">{body.length} row{body.length === 1 ? '' : 's'}</p>}
      <Pager page={cur} pages={pages} onPage={setPage} />
    </section>
  );
}
