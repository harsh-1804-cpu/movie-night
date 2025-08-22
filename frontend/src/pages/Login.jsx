import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import movieNightImg from "../images/movie-night.png"; // ✅ Local image import

export default function Login() {
  const { setToken, setUser } = useContext(AuthContext);
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form);
      setToken(res.data.token);
      setUser(res.data.user);
      nav("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Login failed");
      console.error(err);
    }
  };

  return (
    <div style={wrapperStyle}>
      <form onSubmit={submit} style={formCard}>
        <img
          src={movieNightImg}
          alt="Movie Night"
          style={{ width: 100, margin: "0 auto 15px", display: "block" }}
        />

        <h2 style={titleStyle}>Welcome Back 🎬</h2>
        <p style={subtitleStyle}>Login to join your movie nights</p>

        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          style={inputStyle}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Login
        </button>

        <p style={toggleText}>
          Don’t have an account?{" "}
          <Link to="/signup" style={linkStyle}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

// 🎨 Styles
const wrapperStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  padding: 20,
};

const formCard = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  maxWidth: 400,
  width: "100%",
  background: "#fff",
  padding: "40px 30px",
  borderRadius: 16,
  boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
};

const titleStyle = { textAlign: "center", marginBottom: 5, color: "#222", fontWeight: "600" };
const subtitleStyle = { textAlign: "center", fontSize: 14, color: "#666", marginBottom: 15 };
const inputStyle = { padding: "12px 14px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15 };
const buttonStyle = {
  padding: "12px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  marginTop: 10,
  transition: "all 0.3s ease",
  boxShadow: "0 6px 12px rgba(255,65,108,0.3)",
};
const toggleText = { marginTop: 12, fontSize: 14, textAlign: "center", color: "#444" };
const linkStyle = { color: "#ff416c", fontWeight: "bold", textDecoration: "none" };
