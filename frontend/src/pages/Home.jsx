import React from 'react';
import { Link } from 'react-router-dom';
import banner from '../images/movie-night.png'; // your local logo asset
import bgImage from '../images/cinema-bg.jfif';  // replace with chosen image's local import

export default function Home() {
  return (
    <div style={styles.wrapper}>
      
      {/* Background layer */}
      <div style={{ ...styles.backgroundImage, backgroundImage: `url(${bgImage})` }} />
      <div style={styles.overlay} />

      {/* Foreground content */}
      <div style={styles.card}>
        <img src={banner} alt="Movie Night" style={styles.logo} />

        <h1 style={styles.title}>
          Welcome to <span style={{ color: '#e74c3c' }}>Movie Night</span>
        </h1>

        <p style={styles.subtitle}>
          Create watchlists, invite friends, search movies, and chat in real-time 🎬✨
        </p>

        <div style={styles.buttonGroup}>
          <Link to="/signup" style={buttonStyle('#e74c3c')}>
            Sign Up
          </Link>
          <Link to="/login" style={buttonStyle('#3498db')}>
            Log In
          </Link>
        </div>

        <div style={styles.getStartedWrap}>
          <Link to="/signup" style={styles.getStartedButton}>
            🚀 Get Started
          </Link>
        </div>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// CSS-in-JS styles
const styles = {
  wrapper: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    background: 'linear-gradient(135deg, rgba(30,30,47,0.8), rgba(42,42,64,0.8))',
    zIndex: -1,
  },
  card: {
    maxWidth: 800,
    width: '100%',
    background: '#fff',
    padding: 40,
    borderRadius: 16,
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
    textAlign: 'center',
    animation: 'fadeInUp 0.8s ease-in-out',
  },
  logo: {
    width: 220,
    marginBottom: 20,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  title: { color: '#2c3e50', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#555', marginBottom: 25 },
  buttonGroup: { display: 'flex', justifyContent: 'center', gap: 20 },
  getStartedWrap: { marginTop: 35 },
  getStartedButton: {
    textDecoration: 'none',
    background: '#27ae60',
    color: '#fff',
    padding: '14px 36px',
    borderRadius: 40,
    fontWeight: 'bold',
    fontSize: 18,
    animation: 'pulse 1.8s infinite',
    boxShadow: '0 6px 15px rgba(39,174,96,0.4)',
  },
};

// function for signup/login button style
const buttonStyle = (bg) => ({
  textDecoration: 'none',
  background: bg,
  color: '#fff',
  padding: '12px 28px',
  borderRadius: '30px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: `0 4px 12px ${bg}66`,
});
