// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const watchlistRoutes = require('./routes/watchlists');
const tmdbRoutes = require('./routes/tmdb');

// Import chat model for Socket.IO history
const ChatMessage = require('./models/ChatMessage');

const app = express();
const server = http.createServer(app);

// Allowed frontend origin (for deployment + dev)
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Middleware
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User typing indicator
  socket.on('typing', ({ watchlistId, userId, username, isTyping }) => {
    socket.to(watchlistId).emit('userTyping', { userId, username, isTyping });
  });

  // Join a watchlist room
  socket.on('joinRoom', async ({ watchlistId, userId }) => {
    socket.join(watchlistId);
    socket.to(watchlistId).emit('userJoined', { userId });

    // Send chat history
    const history = await ChatMessage.find({ watchlistId })
      .sort({ createdAt: 1 })
      .limit(100);
    socket.emit('chatHistory', history);
  });

  // Leave a watchlist room
  socket.on('leaveRoom', ({ watchlistId, userId }) => {
    socket.leave(watchlistId);
    socket.to(watchlistId).emit('userLeft', { userId });
  });

  // Handle new chat message
  socket.on('chatMessage', async ({ watchlistId, userId, username, text }) => {
    const msg = new ChatMessage({ watchlistId, userId, username, text });
    await msg.save();
    io.to(watchlistId).emit('newMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Root route
app.get("/", (req, res) => {
  res.send("✅ Movie Night Backend is running!");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy 🚀" });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
