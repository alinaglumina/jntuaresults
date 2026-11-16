import { useEffect, useRef, useState } from 'react';
// hCaptcha "I am human" checkbox. VITE_HCAPTCHA_SITEKEY must be set in production;
// the fallback is hCaptcha's public TEST key (always passes, for local development only).
const SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001';
let loader;
const load = () => (loader ||= new Promise((ok, fail) => {
  if (window.hcaptcha) return ok(window.hcaptcha);
  const s = document.createElement('script'); s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'; s.async = true;
  s.onload = () => ok(window.hcaptcha); s.onerror = () => { loader = null; fail(new Error('load')); }; document.head.appendChild(s);
}));
export default function HCaptcha({ onToken, resetKey }) {
  const box = useRef(null), id = useRef(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    load().then((h) => { if (live && box.current && id.current == null) id.current = h.render(box.current, { sitekey: SITEKEY, callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken('') }); })
      .catch(() => live && setErr(true));
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (id.current != null && window.hcaptcha) { window.hcaptcha.reset(id.current); onToken(''); } }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return err ? <p className="err">Could not load the verification box. Check your internet connection and refresh the page.</p> : <div ref={box} className="hcap" />;
}
