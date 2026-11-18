import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { api } from './routes/api.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', api);

// If the React app has been built, serve it from the same process. That makes
// deployment a single service and means there is only one thing to start.
if (fs.existsSync(config.frontendDist)) {
  app.use(express.static(config.frontendDist));
  app.get('*', (req, res) => res.sendFile(path.join(config.frontendDist, 'index.html')));
}

// Last stop for any error: known ones keep their status, the rest become a 500.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Something went wrong.', details: err.details || [] });
});

app.listen(config.port, () => {
  const mode = config.mockMode ? 'demo mode (no API key)' : `live mode, model ${config.model}`;
  console.log(`Proofdesk API on http://localhost:${config.port} in ${mode}`);
});
