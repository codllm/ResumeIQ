import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRouter from './router/user.router';
import aiRouter from './router/ai.router';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow requests from frontend dev server
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (Mounted under both /api/ai and /api/gemini-ai for maximum compatibility)
app.use('/api/user', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api/gemini-ai', aiRouter);

// Health Check Route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Root Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the API' });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;