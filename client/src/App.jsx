import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import { About, Contact } from './pages/Static.jsx';
import ViewResults from './pages/ViewResults.jsx';
import Admin from './pages/Admin.jsx';
export default function App() {
  return (
    <>
      <Header />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/view-results" element={<ViewResults />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="foot">All © {new Date().getFullYear()} Jawaharlal Nehru Technological University, Anantapur. All Rights Reserved.</footer>
    </>
  );
}
