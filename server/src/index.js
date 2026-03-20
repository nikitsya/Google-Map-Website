import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';

const app = express();
const port = 3000;
const clientDir = fileURLToPath(new URL('../../client/', import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.static(clientDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (_req, res) => {
  res.sendFile('index.html', { root: clientDir });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
