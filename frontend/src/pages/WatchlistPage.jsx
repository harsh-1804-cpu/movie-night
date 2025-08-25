import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';


export default function WatchlistPage() {
  const {id} = useParams();
  const { id:watchlistId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  const [watchlist, setWatchlist] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [tab, setTab] = useState("my"); // "my" or "public"
  const [lists, setLists] = useState([]);

  // Bonus feature states
  const [partyTime, setPartyTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [partyInput, setPartyInput] = useState(''); // for owner input

  const socketRef = useRef(null);
  const messagesRef = useRef(null);

  // Fetch watchlist and setup socket
  useEffect(() => {
    if (!token) return;
    fetchWatchlist();

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socketRef.current.on('connect', () => console.log('Socket connected', socketRef.current.id));

    socketRef.current.emit('joinRoom', { watchlistId: id, userId: user?.id });

    socketRef.current.on('chatHistory', (h) => setMessages(h || []));
    socketRef.current.on('newMessage', (m) => {
      setMessages(prev => [...prev, m]);
      if (Notification.permission === 'granted' && m.userId !== user?.id) {
        new Notification(`${m.username} sent a message`, { body: m.text });
      }
    });

    socketRef.current.on('newMovie', (movie) => {
      fetchWatchlist();
      if (Notification.permission === 'granted') {
        new Notification('New movie added!', { body: movie.title });
      }
    });

    // Typing events
    socketRef.current.on('typing', ({ username }) => {
      if (!typingUsers.includes(username) && username !== user?.username) {
        setTypingUsers(prev => [...prev, username]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== username));
        }, 2000);
      }
    });

    // Watch party updates
    socketRef.current.on('partyTimeUpdated', ({ partyTime }) => {
      setWatchlist(prev => ({ ...prev, partyTime }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveRoom', { watchlistId: id, userId: user?.id });
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  // Countdown timer
  useEffect(() => {
    if (!watchlist?.partyTime) return;

    const target = new Date(watchlist.partyTime);
    setPartyTime(target);

    const interval = setInterval(() => {
      if (!target) return;
      const diff = target - new Date();
      if (diff <= 0) {
        setTimeLeft('Party started!');
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / 1000 / 60 / 60);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [watchlist?.partyTime]);

  const fetchWatchlist = async () => {
    try {
      const res = await api.get(`/watchlists/${id}`,{
          headers: { Authorization: `Bearer ${token}` },
        });
      setWatchlist({
        ...res.data,
        movies: res.data.movies.map(m => ({
          ...m,
          trailerKey: m.trailerKey || null   // <-- ensure trailerKey is available
        }))
      });
      if (res.data.inviteCode) {
        setInviteLink(`${import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173'}/invite/${res.data.inviteCode}`);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/login");
      } else {
        alert(err.response?.data?.msg || 'Could not load watchlist');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this watchlist?")) {
      try {
        await api.delete(`/watchlists/${watchlist._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Watchlist deleted successfully!");
        navigate("/watchlists"); // Redirect back to watchlists page
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.msg || "Delete failed");
      }
    }
  };

  const searchTMDB = async () => {
    if (!query) return;
    try {
      const res = await api.get(`/tmdb/search?q=${encodeURIComponent(query)}`);
      setResults(res.data.results || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/login");
      } else {
        alert('TMDB search failed');
      }
    }
  };

  
  const addMovie = async (movie) => {
    try {
      await api.post(`/watchlists/${id}/movies`, {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        overview: movie.overview,
      });
      socketRef.current.emit('newMovie', { tmdbId: movie.id, title: movie.title });
      fetchWatchlist();
    } catch (err) {
      alert(err.response?.data?.msg || 'Add failed');
    }
  };

  const removeMovie = async (tmdbId) => {
  try {
    await api.delete(`/watchlists/${id}/movies/${tmdbId}`);
    setWatchlist(prev => ({
      ...prev,
      movies: prev.movies.filter(m => m.tmdbId !== tmdbId)
    }));
  } catch (err) {
      alert(err.response?.data?.msg || 'Delete failed');
  }
};

  const handleTyping = (e) => {
    setText(e.target.value);
    socketRef.current.emit('typing', { watchlistId: id, username: user?.username });
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    socketRef.current.emit('chatMessage', {
      watchlistId: id,
      userId: user?.id,
      username: user?.username,
      text,
    });
    setText('');
  };

const generateInvite = async () => {
  try {
    const res = await api.post(`/watchlists/${id}/invite`);
    const inviteLink = `${window.location.origin}/invite/${res.data.code}`;

    await navigator.clipboard.writeText(inviteLink);
    alert("✅ Invite link copied: " + inviteLink);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.msg || "Could not generate invite");
  }
};

const toggleVisibility = async () => {
  try {
    const res = await api.patch(
      `/watchlists/${watchlist._id}/visibility`,
      { isPublic: !watchlist.isPublic },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setWatchlist(res.data);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.msg || "Failed to toggle visibility");
  }
};


// Update party time (owner only)
  const updatePartyTime = async () => {
    if (!partyInput) return alert('Select a date & time');
    try {
      const res = await api.put(`/watchlists/${id}`, { partyTime: new Date(partyInput) });
      setWatchlist(res.data);

      // Broadcast via socket
      socketRef.current.emit('partyTimeUpdated', { partyTime: res.data.partyTime });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to update party time');
    }
  };

  


  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 380px',
      gap: 20,
      padding: 20,
      background: 'linear-gradient(135deg, #1e1e2f, #2a2a40)',
      color: '#fff',
      borderRadius: 12,
    }}>
       <div style={{ 
        padding: 16,
        // Responsive: stack for mobile
        width: '100%',
        '@media(max-width: 768px)': {
          gridColumn: '1 / -1'
        }
      }}>
        <h2 style={{ fontSize: 26, marginBottom: 6 }}>{watchlist?.title}</h2>
        <p style={{ marginBottom: 12, color: '#ccc' }}>{watchlist?.description}</p>

        {/* Countdown Timer */}
        <div style={{ marginBottom: 16, padding: 10, background: '#2f2f46', borderRadius: 8 }}>
          <strong>⏳ Watch Party Countdown:</strong> {timeLeft}
        </div>

        {/* Party time input for owner */}
        {watchlist?.owner?._id === user?.id && (
          <div style={{ marginBottom: 16 }}>
            <strong>Set Watch Party Time: </strong>
            <input
              type="datetime-local"
              value={partyTime ? new Date(partyTime).toISOString().slice(0,16) : ''}
              onChange={e => setPartyInput(e.target.value)}
              style={{
                marginLeft: 8,
                padding: 6,
                borderRadius: 6,
                border: '1px solid #555',
                background: '#1e1e2f',
                color: '#fff',
                cursor: 'pointer',
                width: 'auto',
                maxWidth: '100%',
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                appearance: 'none',
              }}
            />
            <button
              onClick={updatePartyTime}
              style={{
                marginLeft: 6,
                background: '#2ed573',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              Set
            </button>
          </div>
        )}

        {/* Invite Link for Owner */}
        {watchlist?.owner?._id === user?.id && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={generateInvite}
              style={{
                background: '#ff4757',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#fff',
                fontWeight: 'bold',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              {inviteLink ? '📋 Copy Invite Link' : '🔗 Generate Invite Link'}
            </button>
            {inviteLink && <div style={{ marginTop: 6, fontSize: 13, color: '#bbb', wordBreak: 'break-all' }}>Link: {inviteLink}</div>}
          </div>
        )}

        {watchlist?.owner?._id === user?.id && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            {/* Delete Watchlist */}
            <button
              onClick={handleDelete}
              style={{
                background: "#e84118",
                border: "none",
                padding: "10px 16px",
                borderRadius: 6,
                cursor: "pointer",
                color: "#fff",
                fontWeight: "bold",
                flex: 1
              }}
            >
              🗑 Delete Watchlist
            </button>

            {/* Toggle Visibility */}
            <button
              onClick={toggleVisibility}
              style={{
                background: watchlist?.isPublic ? "#2ed573" : "#57606f",
                border: "none",
                padding: "10px 16px",
                borderRadius: 6,
                cursor: "pointer",
                color: "#fff",
                fontWeight: "bold",
                flex: 1
              }}
            >
              {watchlist?.isPublic ? "🌍 Public" : "🔒 Private"}
            </button>
          </div>
        )}

        {/*Search Movies*/}
        <section style={{ marginTop: 12 }}>
          <h4>🎬 Search movies (TMDB)</h4>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <input 
              placeholder="Search movies..." 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 6,
                border: '1px solid #555',
                background: '#1e1e2f',
                color: '#fff',
                minWidth: 0
              }}
            />
            <button
              onClick={searchTMDB}
              style={{
                background: '#3742fa',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#fff',
                flexShrink: 0
              }}
            >
              Search
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            {results.map(r => (
              <div key={r.id} style={{
                display: 'flex',
                alignItems: 'center',
                background: '#2f2f46',
                borderRadius: 8,
                marginBottom: 10,
                overflow: 'hidden',
                flexWrap: 'wrap'
              }}>
                {r.poster_path && (
                  <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} 
                  alt={r.title} 
                  style={{ width: 60, height: 90, objectFit: 'cover' }}/>
                )}
                <div style={{ flex: 1, padding: 10 }}>
                  <b>{r.title}</b> <small>({r.release_date})</small>
                  <p style={{ margin: 6, fontSize: 13, color: '#ccc' }}>{r.overview?.slice(0, 100)}...</p>
                </div>
                <button
                  onClick={() => addMovie(r)}
                  style={{
                    background: '#2ed573',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 0,
                    cursor: 'pointer',
                    color: '#fff',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  ➕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Movies in list */}
        <section style={{ marginTop: 20 }}>
          <h4>📌 Movies in list</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 10 }}>
            {watchlist?.movies?.map(m => (
              <div key={m.tmdbId} style={{
                background: '#2f2f46',
                borderRadius: 8,
                padding: 8,
                position: 'relative',
                textAlign: 'center',
              }}>
                {m.posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w154${m.posterPath}`}
                    alt={m.title}
                    style={{ width: '100%', borderRadius: 6 }}
                  />
                )}
                <p style={{ marginTop: 6, fontWeight: 'bold' }}>{m.title}</p>
                <small style={{ color: '#aaa' }}>{m.releaseDate}</small>

                {/* Trailer Embed */}
                {m.trailerKey ? (
                  <div style={{ marginTop: 8 }}>
                    <iframe
                      width="100%"
                      height="160"
                      src={`https://www.youtube.com/embed/${m.trailerKey}`}
                      title={`${m.title} Trailer`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ borderRadius: 6 }}
                    ></iframe>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                    🎥 No trailer available
                  </p>
                )}

                {/* Delete only for owner */}
                {watchlist?.owner?._id === user?.id && (
                  <button
                    onClick={() => removeMovie(m.tmdbId)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#ff4757',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside style={{ background: '#2f2f46', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.4)', display: 'flex', flexDirection:'column','@media(max-width: 768px)': { gridColumn: '1 / -1', marginTop: 20 }}}>
        <h4>Chat</h4>
        <div ref={messagesRef} style={{flex:1, height: 400, overflowY: 'auto', border: '1px solid #444', padding: 8, marginTop:6, background: '#1e1e2f',borderRadius: 6, }}>
          {messages.map(msg => (
            <div key={msg._id} style={{ marginBottom: 10 }}>
              <b style={{ color: '#2ed573' }}>{msg.username}</b>: {msg.text}
            </div>
          ))}
        </div>

        {/* Typing Indicator */}
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
          {typingUsers.length > 0 && `${typingUsers.join(', ')} is typing...`}
        </div>

        {/* Chat Input */}
        <div style={{ display: 'flex', marginTop: 8, flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1,
              padding: 8,
              borderRadius: 6,
              border: '1px solid #555',
              background: '#1e1e2f',
              color: '#fff',
              minWidth: 0
             }}
            placeholder="Write a message..."
            value={text}
            onChange={handleTyping}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          />
          <button onClick={sendMessage} 
          style={{ 
            marginLeft: 6,
            background: '#3742fa',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#fff',
            fontWeight: 'bold',
            flexShrink: 0
          }}>Send</button>
        </div>
      </aside>
    </div>
  );
}
