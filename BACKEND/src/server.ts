import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const server = http.createServer(app);
import  {invokeGeminiai}  from './services/ai/ai.service';
async function startServer() {
  if (!MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    invokeGeminiai();
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

startServer();
