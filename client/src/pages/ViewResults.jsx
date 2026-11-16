import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import HCaptcha from '../components/HCaptcha.jsx';


const HT_RE = /hall\s*-?\s*ticket|^\s*h\.?\s*t\.?\s*no|roll\s*(no|number)|regd?\.?\s*(no|number)|registration\s*(no|number)/i;
const SNO_RE = /^\s*(s\.?\s*no\.?|sl\.?\s*no\.?|serial.*)\s*$/i;
const NAME_RE = /name/i, NOT_STUDENT_RE = /subject|course|paper|college|branch|father|mother/i;
const LEFT_RE = /subject\s*name|^\s*subject\s*$|course\s*name|paper\s*name/i;

// One sheet of a student's result: hall ticket + name above, subject rows in a table
function SheetResult({ s, showSheetName }) {
  const ki = s.keyCol ?? s.headers.findIndex((h) => HT_RE.test(h));
  const ni = s.headers.findIndex((h) => NAME_RE.test(h) && !NOT_STUDENT_RE.test(h));
  const cols = s.headers.map((h, i) => i).filter((i) => i !== ki && i !== ni && s.headers[i] && !SNO_RE.test(s.headers[i]));
  const first = s.rows[0] || [];
  return (
    <div className="sres">
      {showSheetName && s.name && <div className="sres-name">{s.name}</div>}
      <div className="rhead">
        <div>HallTicket Number : <b>{ki >= 0 ? first[ki] : ''}</b></div>
        {ni >= 0 && <div>Student Name : <b>{first[ni]}</b></div>}
      </div>
      <div className="rtable">
        <table>
          <thead><tr>{cols.map((i) => <th key={i}>{s.headers[i]}</th>)}</tr></thead>
          <tbody>{s.rows.map((r, k) => <tr key={k}>{cols.map((i) => <td key={i} className={LEFT_RE.test(s.headers[i]) ? 'l' : ''}>{r[i]}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

// Student result lookup: hall ticket number + "I am human", then shows only that student's result.
export default function ViewResults() {
  const [params] = useSearchParams();
  const id = params.get('resultSetId');
  const [meta, setMeta] = useState(null), [metaErr, setMetaErr] = useState('');
  const [ht, setHt] = useState(''), [touched, setTouched] = useState(false);
  const [token, setToken] = useState(''), [reset, setReset] = useState(0);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [res, setRes] = useState(null);
  useEffect(() => { if (!id) return setMetaErr('Result not found'); api.result(id).then(setMeta).catch((e) => setMetaErr(e.message)); }, [id]);
  const empty = !ht.trim();
  const submit = async (e) => {
    e.preventDefault(); setTouched(true); setErr('');
    if (empty) return;
    setBusy(true); setRes(null);
    try { setRes(await api.lookup(id, ht.trim(), token)); } catch (x) { setErr(x.message); }
    setReset((n) => n + 1); setBusy(false);
  };
  if (metaErr) return <section className="wrap narrow"><div className="card pad"><p className="err">{metaErr}</p><Link to="/" className="show">‹ Back to results</Link></div></section>;
  const back = () => { setRes(null); setHt(''); setTouched(false); setErr(''); };
  return (
    <section className="wrap vr">
      <div className="banner">Title : {meta?.title || '…'}</div>
      {!res ? (
        <form className="card vform" onSubmit={submit} noValidate>
          <div className="vrow">
            <label htmlFor="ht">Enter Hallticket Number : #</label>
            <input id="ht" value={ht} onChange={(e) => { setHt(e.target.value); setErr(''); }} placeholder="Hallticket Number" autoComplete="off" maxLength={40} autoFocus />
          </div>
          {touched && empty && <div className="req">Hallticket Number Required</div>}
          <div className="vcap"><HCaptcha onToken={setToken} resetKey={reset} /></div>
          {err && <div className="req">{err}</div>}
          <button className="vsearch-btn" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
        </form>
      ) : (
        <div className="vres">
          <div className="vres-actions"><button className="show" onClick={back}>‹ Search another Hallticket</button><button className="show" onClick={() => window.print()}>Print</button></div>
          {res.sheets.map((s, i) => <SheetResult key={i} s={s} showSheetName={res.sheets.length > 1} />)}
          <p className="disc"><b>Result Disclaimer :</b> Data and information are provided for informational purposes only, and the final results will be given by the respective Controller of Examinations.</p>
          <div className="notice">Any discrepancy in the result noted above must be brought to the notice of the Controller of Examinations, within two weeks from the above date.</div>
        </div>
      )}
    </section>
  );
}
