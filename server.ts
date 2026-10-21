import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI server client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Multi-turn Gemini SEO Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Format contents for multi-turn history
    const contents = messages.map((m: { role: 'user' | 'model'; text: string }) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const systemInstruction = 
      "You are the expert SEO Slug & URL Strategy Assistant for the SlugGenerator web application. " +
      "Your role is to help users optimize URL slugs, analyze keyword relevance, recommend clean URL structures, " +
      "guide 301 redirects during migrations, craft Shopify URL handles, and answer general technical SEO questions. " +
      "Keep answers concise, direct, professional, and actionable without filler." +
      (context?.currentSlug ? ` The user is currently editing the slug: "${context.currentSlug}" for the title: "${context.currentTitle || ''}".` : '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'I could not generate an SEO response. Please try rephrasing.';
    return res.json({ text: replyText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: error?.message || 'Failed to generate AI response. Please check your API key or connection.' 
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
