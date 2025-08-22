import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import WatchlistPage from './pages/WatchlistPage';
import InvitePage from './pages/InvitePage';

export default function App() {
  return (
    <div>
      <header style={styles.header}>
        <Link to="/" style={styles.brand}>🎬 Movie Night</Link>
        <nav>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/login" style={styles.link}>Login</Link>
          <Link to="/signup" style={styles.link}>Sign Up</Link>
        </nav>
      </header>

      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/watchlist/:id" element={<WatchlistPage />} />
          <Route path="/invite/:code" element={<InvitePage />} />
        </Routes>
      </main>
    </div>
  );
}

const styles = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding: '10px 20px', borderBottom: '1px solid #eee' },
  brand: { fontWeight: 700, textDecoration:'none', color:'#333' },
  link: { marginLeft: 12, textDecoration: 'none', color:'#555' },
  main: { padding: 20 }
};
