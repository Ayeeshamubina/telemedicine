const mongoose = require('mongoose');

// Disable command buffering so disconnected states fail fast and gracefully fall back to in-memory store
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medibridge', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB: ${error.message}`);
    console.warn('[Database Warning] Continuing in resilient in-memory mode for WebRTC, Socket.IO, and Live Translation.');
  }
};

module.exports = connectDB;
