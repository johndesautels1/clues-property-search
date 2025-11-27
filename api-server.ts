import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Search stream endpoint - SSE
app.post('/api/property/search-stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const searchStream = await import('./api/property/search-stream');
    await searchStream.default(req as any, res as any);
  } catch (error: any) {
    console.error('Search stream error:', error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: error.message || 'Unknown error' })}\n\n`);
    res.end();
  }
});

// Autocomplete endpoint
app.get('/api/property/autocomplete', async (req: Request, res: Response) => {
  try {
    const autocomplete = await import('./api/property/autocomplete');
    await autocomplete.default(req as any, res as any);
  } catch (error: any) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Property search (non-streaming)
app.post('/api/property/search', async (req: Request, res: Response) => {
  try {
    const search = await import('./api/property/search');
    await search.default(req as any, res as any);
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
});
