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

// Optimized Slug Suggestions endpoint using Gemini 3.8 Flash
app.post('/api/suggest-slugs', async (req, res) => {
  try {
    const { title, separator = '-' } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const sep = separator === '_' ? '_' : '-';

    const prompt = 
      `Analyze the following title or heading: "${title.trim()}".\n` +
      `Generate exactly 3 alternative, highly optimized URL slugs following Google SEO and web architecture best practices.\n` +
      `Format requirements:\n` +
      `1. Use '${sep}' as the word separator. All lowercase alphanumeric only.\n` +
      `2. Each alternative must be distinctly targeted:\n` +
      `   - Option 1: "Keyword Core" - Strips unnecessary stop words to focus crawler weight on primary target keywords.\n` +
      `   - Option 2: "Short & Punchy" - Ultra compact (typically 2-4 words, under 35 chars) for high CTR and zero SERP truncation.\n` +
      `   - Option 3: "High Search Intent" - Evergreen and search query aligned (e.g. removes ephemeral years or sharpens intent).\n` +
      `3. Return a JSON object with a "suggestions" array of exactly 3 objects. Each object must have:\n` +
      `   - "slug": string (e.g. "best-running-shoes")\n` +
      `   - "label": string (e.g. "Keyword Core", "Short & Punchy", "High Search Intent")\n` +
      `   - "rationale": string (1 concise sentence explaining the SEO advantage)\n\n` +
      `Return strictly valid JSON only without markdown fences or additional explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);

    if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
      // Validate and clean each suggestion slug
      const cleanedSuggestions = parsed.suggestions.slice(0, 3).map((item: any) => ({
        slug: String(item.slug || '').toLowerCase().replace(/[^a-z0-9-_]/g, sep).replace(new RegExp(`\\${sep}{2,}`, 'g'), sep).replace(new RegExp(`^\\${sep}+|\\${sep}+$`, 'g'), ''),
        label: String(item.label || 'Optimized Slug'),
        rationale: String(item.rationale || 'Optimized for search engine visibility and click-through rates.'),
      }));

      return res.json({ suggestions: cleanedSuggestions, source: 'gemini' });
    }

    return res.status(500).json({ error: 'Invalid response format from AI model' });
  } catch (error: any) {
    console.error('Suggest Slugs API Error:', error?.message);
    return res.status(500).json({ 
      error: error?.message || 'Failed to generate suggestions via AI' 
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
