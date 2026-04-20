import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genzstore';

if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.error(`❌ CRITICAL: MONGODB_URI environment variable is required in production`);
  console.error('Please set MONGODB_URI in your .env file.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  WARNING: MONGODB_URI not set. Using local MongoDB at mongodb://localhost:27017/genzstore');
}

const PORT = process.env.PORT || 5000;

// Ensure the database name is explicitly stated in Atlas connections
const connectionOptions = MONGODB_URI.includes('?') 
  ? { dbName: 'genzstore' } 
  : {};

mongoose.connect(MONGODB_URI, connectionOptions)
  .then((conn) => {
    console.log(`✅ MongoDB Connected to: ${conn.connection.name}`);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });
