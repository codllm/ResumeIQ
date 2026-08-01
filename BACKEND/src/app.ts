import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRouter from './router/user.router';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow requests from frontend dev server
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// User Routes
app.use('/api/user', userRouter);


// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;