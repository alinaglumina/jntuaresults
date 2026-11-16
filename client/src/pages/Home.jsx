import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, fileUrl, fmtDate } from '../api.js';
import Pager from '../components/Pager.jsx';

function ShowButton({ r }) {
  if (r.type === 'link') return <a className="show" href={r.url} target="_blank" rel="noopener noreferrer">Show</a>;
  if (r.type === 'sheet') return <Link className="show" to={`/view-results?resultSetId=${r.id}`}>Show</Link>;
  return <a className="show" href={fileUrl(r.id)} target="_blank" rel="noopener noreferrer">Show</a>;
}
export default function Home() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => setPage(1), [q]);
  useEffect(() => {
    let live = true; setData(null); setErr('');
    api.results(page, q).then((d) => live && setData(d)).catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, [page, q]);
  return (
    <section className="wrap">
      <div className="sec-head"><span className="bar" /><h2>Published Results</h2></div>
      {q && <p className="note">Showing results for “{q}”{data ? ` · ${data.total} found` : ''}</p>}
      <div className="card">
        <table className="tbl">
          <thead><tr><th className="c-date">PublishDate</th><th>Result</th><th className="c-link">Link</th></tr></thead>
          <tbody>
            {!data && !err && <tr><td colSpan="3" className="empty">Loading…</td></tr>}
            {err && <tr><td colSpan="3" className="empty">Could not load results. Please try again later.</td></tr>}
            {data && data.items.length === 0 && <tr><td colSpan="3" className="empty">No results found.</td></tr>}
            {data && data.items.map((r) => (
              <tr key={r.id}><td className="c-date">{fmtDate(r.publishDate)}</td><td>{r.title}</td><td className="c-link"><ShowButton r={r} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </section>
  );
}
