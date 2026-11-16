import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import { About, Contact } from './pages/Static.jsx';
import Viewer from './pages/Viewer.jsx';
import Admin from './pages/Admin.jsx';
export default function App() {
  return (
    <>
      <Header />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/view/:id" element={<Viewer />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="foot">© {new Date().getFullYear()} Jawaharlal Nehru Technological University Anantapur · Examination Information Center</footer>
    </>
  );
}
