require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Simple, bulletproof CORS — allow all origins
// (avoids callback-based origin check issues in Express 5)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

// Middleware
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// Socket.io injection middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/projects/:projectId/tasks', require('./routes/taskRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve React frontend static files (built from frontend/dist)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA fallback — use app.use (not app.get) to avoid Express 5 path-to-regexp issues
app.use((req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error Handling Middleware (API errors only)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
