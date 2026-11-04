/**
 * Author: trangtttce191027
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { recommendationRoutes } from './src/routes/recommendationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in .env');
}

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: '4TStore AI API is running!' });
});

app.use('/api/recommendations', recommendationRoutes.router);

const startServer = async () => {
    app.listen(PORT, () => {
        console.log(`TechStore AI server running at http://localhost:${PORT}`);
    });
}
startServer();

