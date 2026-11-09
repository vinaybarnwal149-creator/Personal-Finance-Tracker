import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.warn(`Failed to connect to ${env.MONGODB_URI}: ${err.message}`);
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      logger.info('Attempting fallback to in-memory MongoDB for local development/testing...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        const conn = await mongoose.connect(uri);
        isConnected = true;
        logger.info(`Fallback in-memory MongoDB connected at ${uri}`);
        return;
      } catch (memErr) {
        logger.error(`Fallback in-memory MongoDB failed: ${memErr.message}`);
      }
    }
    if (process.env.VERCEL) {
      logger.warn('Running on Vercel: MongoDB not connected yet. Please set MONGODB_URI environment variable on Vercel.');
      return;
    }
    throw err;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
