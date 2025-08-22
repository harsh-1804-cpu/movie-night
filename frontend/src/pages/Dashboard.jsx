import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../images/cinema-bg.jfif'; 
import fallbackPoster from '../images/movie-night.png'; // fallback thumbnail

export default function Dashboard(){
  const { token, user, logout } = useContext(AuthContext);
  const [lists, setLists] = useState([]);
  const [title, setTitle] = useState('');
  const nav = useNavigate();

  useEffect(()=>{ if (token) fetchLists(); }, [token]);

  const fetchLists = async () => {
    try {
      const res = await api.get('/watchlists');
      setLists(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const create = async () => {
    if (!title.trim()) return alert('Enter title');
    try {
      await api.post('/watchlists', { title, description:'', visibility:'private' });
      setTitle('');
      fetchLists();
    } catch (err) {
      alert(err.response?.data?.msg || 'Could not create');
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* background layers */}
      <div style={{ ...styles.backgroundImage, backgroundImage: `url(${bgImage})` }} />
      <div style={styles.overlay} />

      {/* main content card */}
      <div style={styles.card}>
        
        {/* header */}
        <div style={styles.header}>
          <h2 style={styles.heading}>🎬 Dashboard</h2>
          <div>
            {user ? <span style={styles.greeting}>Hi, {user.username}</span> : null}
            <button onClick={()=>{ logout(); nav('/'); }} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>

        {/* create new watchlist */}
        <div style={styles.newList}>
          <input 
            placeholder="New watchlist title" 
            value={title} 
            onChange={(e)=>setTitle(e.target.value)} 
            style={styles.input}
          />
          <button onClick={create} style={styles.createBtn}>+ Create</button>
        </div>

        {/* watchlists section */}
        <h3 style={styles.subHeading}>Your accessible watchlists</h3>
        <ul style={styles.listWrap}>
          {lists.map(l => {
            const poster = l.movies?.[0]?.posterPath 
              ? `https://image.tmdb.org/t/p/w92${l.movies[0].posterPath}`
              : fallbackPoster;

            return (
              <li key={l._id} className="watchlist-item" style={styles.listItem}>
                <div style={styles.posterWrap}>
                  <img src={poster} alt="poster" style={styles.poster} />
                </div>
                <div style={{flex:1, marginLeft:12}}>
                  <Link to={`/watchlist/${l._id}`} style={styles.listLink}>
                    {l.title}
                  </Link>
                  <div style={styles.meta}>
                    <small>{l.visibility}</small> 
                    <span> · owner: {l.owner?.username}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .watchlist-item {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .watchlist-item:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        .watchlist-item:hover img {
          transform: scale(1.1);
        }
        .watchlist-item img {
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 20px',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(8px) brightness(0.4)',
    zIndex: -2,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, rgba(20,20,30,0.8), rgba(30,30,50,0.8))',
    zIndex: -1,
  },
  card: {
    width: '100%',
    maxWidth: 950,
    background: '#fff',
    padding: 32,
    borderRadius: 16,
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
    animation: 'fadeInUp 0.8s ease',
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  heading: { margin: 0, color: '#2c3e50' },
  greeting: { marginRight: 12, fontWeight: '500', color: '#444' },
  logoutBtn: {
    padding: '6px 14px',
    background: '#e74c3c',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
  },
  newList: { marginBottom: 24, display:'flex', gap:10 },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 6,
    border: '1px solid #ccc',
  },
  createBtn: {
    padding: '10px 20px',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  subHeading: { color: '#2c3e50', marginBottom: 14 },
  listWrap: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { 
    background: '#f9f9f9',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    display:'flex',
    alignItems:'center',
    boxShadow:'0 2px 6px rgba(0,0,0,0.06)',
    cursor:'pointer'
  },
  posterWrap: {
    width: 60,
    height: 90,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: 6,
    background: '#ddd',
  },
  poster: { width: '100%', height: '100%', objectFit: 'cover' },
  listLink: { fontWeight: '600', color: '#3498db', textDecoration: 'none', fontSize: 18 },
  meta: { fontSize: 13, color:'#555', marginTop:4 }
};
