import express from 'express';
import apiRoutes from './routes';

export const app = express();

// Middleware
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({ extended: true }));

// Use the API routes when path starts with /api
app.use('/api', apiRoutes);
