import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with generous development capabilities
app.use(cors({
  origin: '*', // For local dev and sandbox ease
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mounting Static folders for uploads (so user can download them or preview them!)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.status(200).json({ status: 'UP', message: 'FinanceLens AI Service running perfectly.' });
});

// Custom 404 handler
app.use((req: any, res: any, next: any) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Express boundary error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Failure'
  });
});

// Boot up server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 FINANCELENS AI BACKEND SERVICE RUNNING`);
  console.log(`💻 Local port: http://localhost:${PORT}`);
  console.log(`🌐 Health status: http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});
