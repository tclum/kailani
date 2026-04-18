import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';

import { initSocket } from './lib/socket';
import authRoutes from './routes/auth';
import modelRoutes from './routes/models';
import brandRoutes from './routes/brands';
import campaignRoutes from './routes/campaigns';
import messageRoutes from './routes/messages';
import mediaRoutes from './routes/media';
import photographerRoutes from './routes/photographers';
import adminRoutes from './routes/admin';
import swipeRoutes from './routes/swipe';
import verificationRoutes from './routes/verification';
import reviewRoutes from './routes/reviews';
import savedRoutes from './routes/saved';
import reportRoutes from './routes/reports';
import blockRoutes from './routes/blocks';
import structuredReviewRoutes from './routes/structured-reviews';
import workingTogetherRoutes from './routes/working-together';
import tutorialRoutes from './routes/tutorials';
import spotlightRoutes from './routes/spotlights';

const app = express();
app.set('trust proxy', 1);
const httpServer = http.createServer(app);

initSocket(httpServer);

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/threads', messageRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/photographers', photographerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/structured-reviews', structuredReviewRoutes);
app.use('/api/working-together', workingTogetherRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/spotlights', spotlightRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT ?? 4000;
httpServer.listen(PORT, () => {
  console.log(`Kailani API running on http://localhost:${PORT}`);
});
