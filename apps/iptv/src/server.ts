import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import m3uRoutes from './routes/m3u.routes';
import streamRoutes from './routes/stream.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    query: req.query,
  });
  next();
});

app.use(m3uRoutes);
app.use(streamRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    logger.info(`IPTV service started on port ${config.port}`);
  });
}

export { app };
export { logger } from './utils/logger';
