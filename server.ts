import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy GoogleGenAI initialization helper
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// AI: Ask the book
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, bookTitle, author, currentChapter, contextText } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the workspace environment.',
        offlineFallback: true,
      });
    }

    const prompt = `You are Lumina AI, an intelligent, spoiler-conscious desktop reading companion for the book "${bookTitle || 'the current text'}" by ${author || 'the author'}.
The reader is currently reading: "${currentChapter || 'the current section'}".

CONTEXT FROM CURRENT CHAPTER / EXCERPT:
"""
${(contextText || '').slice(0, 16000)}
"""

READER'S QUESTION:
"${question}"

Provide a clear, insightful, literary analysis response. Keep it spoiler-free for events that occur beyond the current chapter. Format nicely with markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error('AI Ask Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI response' });
  }
});

// AI: Character Analysis & Dossier
app.post('/api/ai/character', async (req, res) => {
  try {
    const { characterName, bookTitle, currentExcerpt } = req.body;
    if (!characterName) {
      return res.status(400).json({ error: 'Character name is required' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the workspace environment.',
        offlineFallback: true,
      });
    }

    const prompt = `You are Lumina AI. Provide a structured character dossier for "${characterName}" from the book "${bookTitle || 'the current text'}".
Based on this context:
"""
${(currentExcerpt || '').slice(0, 14000)}
"""

Provide a concise breakdown with:
- **Role & Archetype**: Quick 1-sentence description
- **Key Traits & Personality**: 3 bullet points
- **Known Motivations & Conflicts**: What drives them
- **Key Quotes or Actions**: Notable moments
- **Important Relationships**: Interactions with other figures
Do NOT reveal spoilers beyond what a reader has encountered.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ dossier: response.text });
  } catch (error: any) {
    console.error('AI Character Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze character' });
  }
});

// AI: Chapter Key Insights & Synthesis
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { chapterTitle, chapterText, bookTitle } = req.body;
    if (!chapterText) {
      return res.status(400).json({ error: 'Chapter text is required' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the workspace environment.',
        offlineFallback: true,
      });
    }

    const prompt = `Summarize and provide key takeaways for "${chapterTitle || 'Chapter'}" from "${bookTitle || 'the book'}":

TEXT:
"""
${chapterText.slice(0, 20000)}
"""

Format response with:
1. **Executive Summary** (2-3 sentences)
2. **Key Plot Points or Arguments** (bulleted)
3. **Themes & Symbolism** (bulleted)
4. **Reflective Question for the Reader**`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('AI Summarize Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate chapter summary' });
  }
});

// AI: Contextual Vocabulary Explainer
app.post('/api/ai/vocabulary', async (req, res) => {
  try {
    const { word, sentenceContext, bookTitle } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the workspace environment.',
        offlineFallback: true,
      });
    }

    const prompt = `Define the word "${word}" as used specifically in this literary context:
Sentence: "${sentenceContext || word}"
Book: "${bookTitle || 'Literary work'}"

Provide:
- **Pronunciation & Part of Speech**
- **Definition in this Context**
- **Etymology / Historical Nuance** (brief)
- **Modern Example Sentence**`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('AI Vocabulary Error:', error);
    res.status(500).json({ error: error.message || 'Failed to explain word' });
  }
});

// Vite middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
        watch: isHmrDisabled ? null : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumina Reader server running on port ${PORT}`);
  });
}

startServer();
