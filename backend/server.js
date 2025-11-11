const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

// Load environment variables
dotenv.config();

// Load face recognition models
const { loadModels } = require('./utils/faceRecognition');

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ Create separate HTTP server for model files on port 8001 (SAME AS ORIGINAL)
const modelApp = express();
modelApp.use(cors());
modelApp.use(express.static(path.join(__dirname, 'utils/tfjs_model')));
const modelServer = http.createServer(modelApp);

modelServer.listen(8001, () => {
  console.log('🎯 Model server running on http://localhost:8001');
});

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const majorRoutes = require('./routes/majors');
const subjectRoutes = require('./routes/subjects');
const lessonRoutes = require('./routes/lessons');
const examRoutes = require('./routes/exams');
const enrollmentRoutes = require('./routes/enrollments');
const progressRoutes = require('./routes/progress');
const dashboardRoutes = require('./routes/dashboard');
const blogRoutes = require('./routes/blog');
const questionRoutes = require('./routes/questions');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const faceRoutes = require('./routes/face');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/face', faceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

// Load face recognition models before starting server
let faceRecognitionStatus = '⚠️  NOT AVAILABLE';

(async () => {
  // Start server FIRST
  app.listen(PORT, async () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 Learning Platform Backend Server        ║
║   📡 Running on: http://localhost:${PORT}      ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}               ║
║   🎯 Model Server: http://localhost:8001     ║
║   🤖 Face Recognition: Loading...            ║
║   📅 Started: ${new Date().toLocaleString()}   ║
╚═══════════════════════════════════════════════╝
    `);
    
    // ✅ Load models AFTER servers started (SAME AS ORIGINAL)
    try {
      console.log('\n🎯 Loading face recognition models...');
      
      // Load with CUSTOM MODEL (SAME AS ORIGINAL: hardcode http://localhost:8001)
      await loadModels({
        customModelPath: path.join(__dirname, 'utils/tfjs_model'),
        preferCustom: false // SAME AS ORIGINAL
      });
      
      faceRecognitionStatus = '✅ READY (CUSTOM)';
      console.log('✅ Face recognition models loaded successfully with CUSTOM model!\n');
    } catch (error) {
      console.error('❌ Failed to load face recognition models:', error.message);
      console.log('⚠️ Server running without face recognition features\n');
    }
  });
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
