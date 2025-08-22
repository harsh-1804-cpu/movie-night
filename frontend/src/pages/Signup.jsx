import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import movieNightImg from "../images/movie-night.png"; // ✅ Local image import

export default function Signup() {
  const { setToken, setUser } = useContext(AuthContext);
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);


  const submit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("username", form.username);
      fd.append("email", form.email);
      fd.append("password", form.password);
      if (avatar) fd.append("avatar", avatar);

      const res = await api.post("/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setToken(res.data.token);
      setUser(res.data.user);
      nav("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Signup failed");
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

        <h2 style={titleStyle}>Create Account 🍿</h2>
        <p style={subtitleStyle}>Join and start sharing watchlists</p>

        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          style={inputStyle}
        />
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

        {/* Avatar Upload + Preview */}
        <div style={{ margin: "12px 0", fontSize: 14 }}>
          <label style={{ fontWeight: "500" }}> Upload Avatar (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setAvatar(file);
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setPreview(reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ marginTop: "6px" }}
          />

          <div
            style={{
              marginTop: 15,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: "fadeScaleIn 0.4s ease-out",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 120,
                height: 120,
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #ff4d6d",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                background: "#f2f2f2",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Avatar Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <img
                  src="https://cdn-icons-png.flaticon.com/512/847/847969.png" // default placeholder
                  alt="Default Avatar"
                  style={{
                    width: "70%",
                    opacity: 0.6,
                  }}
                />
              )}

              {/* Remove button (only if custom avatar uploaded) */}
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatar(null);
                    setPreview(null);
                  }}
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    color: "#fff",
                    width: 24,
                    height: 24,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <small style={{ marginTop: 6, color: "#555" }}>
              {preview ? "Profile preview" : "Default avatar"}
            </small>
          </div>
        </div>

        {/* Add CSS keyframes inside your global CSS */}
        <style>
        {`
        @keyframes fadeScaleIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        `}
        </style>



        <button type="submit" style={buttonStyle}>
          Sign up
        </button>

        <p style={toggleText}>
          Already have an account?{" "}
          <Link to="/login" style={linkStyle}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

// 🎨 Reuse the same styles as Login
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
