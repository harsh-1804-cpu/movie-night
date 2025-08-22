import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import inviteImg from '../images/movie-night.png'; // your movie-night image

export default function InviteJoin() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [status, setStatus] = useState('loading'); 
  // "loading" → "success" → redirect

  useEffect(() => {
    const join = async () => {
      try {
        const res = await api.post(`/watchlists/join/${code}`);
        setStatus('success');
        setTimeout(() => navigate(`/watchlist/${res.data.watchlist._id}`), 1500); // delay for animation
      } catch (err) {
        alert(err.response?.data?.msg || 'Join failed');
        navigate('/login');
      }
    };
    if (token) join();
    else navigate('/login');
  }, [code, token, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={inviteImg} alt="Movie Night" style={styles.image} />
        
        {status === 'loading' && (
          <>
            <h2 style={styles.title}>Joining Watchlist...</h2>
            <p style={styles.text}>Please wait while we connect you to the party 🎬🍿</p>
            <div className="loader" />
          </>
        )}

        {status === 'success' && (
          <>
            <h2 style={styles.title}>Success! 🎉</h2>
            <p style={styles.text}>You’ve joined the watchlist. Redirecting...</p>
            <div className="checkmark"></div>
          </>
        )}
      </div>

      {/* Inline animations */}
      <style>{`
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #27ae60;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 16px auto 0;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .checkmark {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: inline-block;
          border: 3px solid #27ae60;
          position: relative;
          margin: 16px auto 0;
          animation: scaleUp 0.3s ease-out forwards;
        }
        .checkmark::after {
          content: '';
          position: absolute;
          left: 12px;
          top: 18px;
          width: 12px;
          height: 24px;
          border-right: 3px solid #27ae60;
          border-bottom: 3px solid #27ae60;
          transform: rotate(45deg);
          animation: draw 0.4s ease-out 0.3s forwards;
          opacity: 0;
        }
        @keyframes scaleUp {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes draw {
          from { opacity: 0; height: 0; }
          to { opacity: 1; height: 24px; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    color: '#fff',
    padding: 20,
  },
  card: {
    textAlign: 'center',
    background: 'rgba(0,0,0,0.7)',
    padding: '30px 40px',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    maxWidth: 400,
  },
  image: {
    width: 80,
    marginBottom: 20,
  },
  title: {
    marginBottom: 10,
    fontSize: 24,
  },
  text: {
    fontSize: 14,
    color: '#ddd',
  },
};
