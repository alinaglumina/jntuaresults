import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Pager from '../components/Pager.jsx';

const PAGES = {
  'director-evaluation': { title: 'Director of Evaluation', kind: 'cards' },
  controller: { title: 'Controller of Examinations', kind: 'cards' },
  'additional-controllers': { title: 'Additional Controller of Examinations', kind: 'table' },
};
const initials = (n) => n.replace(/^(prof|dr|mr|mrs|ms|sri|smt)\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function Cards({ items }) {
  return (
    <div className="ocards">
      {items.map((o) => (
        <article className="ocard" key={o.id}>
          {o.photo ? <img src={o.photo} alt={o.name} className="ophoto" /> : <div className="ophoto ph" aria-hidden="true">{initials(o.name)}</div>}
          <h3>{o.name}</h3>
          {o.designation && <p>{o.designation}</p>}
        </article>
      ))}
    </div>
  );
}
function Table({ items }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / 25));
  const cur = Math.min(page, pages);
  const slice = items.slice((cur - 1) * 25, cur * 25);
  return (
    <>
      <div className="card">
        <table className="tbl otable">
          <thead><tr><th className="c-sno">S.No.</th><th>Name</th><th>Designation</th></tr></thead>
          <tbody>{slice.map((o, i) => <tr key={o.id}><td className="c-sno">{(cur - 1) * 25 + i + 1}</td><td>{o.name}</td><td>{o.designation}</td></tr>)}</tbody>
        </table>
      </div>
      <Pager page={cur} pages={pages} onPage={setPage} />
    </>
  );
}
export default function Officials() {
  const { slug } = useParams();
  const cfg = PAGES[slug];
  const [items, setItems] = useState(null), [err, setErr] = useState('');
  useEffect(() => { if (!cfg) return; setItems(null); setErr(''); api.officials(slug).then((d) => setItems(d.items)).catch((e) => setErr(e.message)); }, [slug, cfg]);
  if (!cfg) return <Navigate to="/about" replace />;
  return (
    <section className="wrap narrow wide">
      <div className="sec-head"><span className="bar" /><h2>{cfg.title}</h2></div>
      {err ? <p className="empty">Could not load this page. Please try again later.</p>
        : !items ? <p className="empty">Loading…</p>
        : items.length === 0 ? <p className="empty">Details will be updated soon.</p>
        : cfg.kind === 'cards' ? <Cards items={items} /> : <Table items={items} />}
    </section>
  );
}
