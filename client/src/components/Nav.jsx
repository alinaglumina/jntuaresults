import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
export default function Nav() {
  const [open, setOpen] = useState(false);       // About Us dropdown
  const [searching, setSearching] = useState(false);
  const [params] = useSearchParams();
  const nav = useNavigate();
  const box = useRef(null);
  useEffect(() => { const f = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); }; document.addEventListener('click', f); return () => document.removeEventListener('click', f); }, []);
  const submit = (e) => { e.preventDefault(); const q = new FormData(e.target).get('q').trim(); nav(q ? `/?q=${encodeURIComponent(q)}` : '/'); };
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-in">
        <NavLink to="/" end className="nav-a">Home</NavLink>
        <div className="nav-dd" ref={box}>
          <button className="nav-a nav-btn" aria-expanded={open} onClick={() => setOpen(!open)}>About Us <span className="caret" aria-hidden="true" /></button>
          {open && (
            <div className="dd-menu" role="menu">
              <NavLink to="/about" onClick={() => setOpen(false)} role="menuitem">About the Center</NavLink>
              <a href="https://www.jntua.ac.in" target="_blank" rel="noopener noreferrer" role="menuitem">JNTUA Website</a>
            </div>
          )}
        </div>
        <NavLink to="/contact" className="nav-a">Contact Us</NavLink>
        <button className="nav-search" aria-label="Search results" onClick={() => setSearching(!searching)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></svg>
        </button>
      </div>
      {searching && (
        <form className="nav-sbar" onSubmit={submit} role="search">
          <input name="q" defaultValue={params.get('q') || ''} placeholder="Search results, e.g. B.Tech R23 Supplementary" autoFocus aria-label="Search results" />
          <button type="submit">Search</button>
        </form>
      )}
    </nav>
  );
}
