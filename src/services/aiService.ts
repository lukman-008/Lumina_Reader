export interface AIAskRequest {
  question: string;
  bookTitle: string;
  author: string;
  currentChapter: string;
  contextText: string;
}

export interface AICharacterRequest {
  characterName: string;
  bookTitle: string;
  currentExcerpt: string;
}

export interface AISummarizeRequest {
  chapterTitle: string;
  chapterText: string;
  bookTitle: string;
}

export interface AIVocabularyRequest {
  word: string;
  sentenceContext: string;
  bookTitle: string;
}

class AIService {
  public async askBook(req: AIAskRequest): Promise<{ answer: string; isOfflineFallback?: boolean }> {
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      return { answer: data.answer };
    } catch (err: any) {
      console.warn('AI Ask API error or offline mode:', err.message);
      // Offline / fallback response
      return {
        answer: `### Offline Insight for "${req.question}"\n\n*Note: Running in offline mode without cloud AI connection.*\n\nBased on the current chapter **${req.currentChapter}** of *${req.bookTitle}*:\n- Key context: The passage focuses on the progression of the narrative.\n- The selected query pertains to thematic exploration of the text.\n- When connected to the internet, Lumina AI uses Gemini 2.5 Flash with deep literary synthesis across the full volume.`,
        isOfflineFallback: true,
      };
    }
  }

  public async getCharacterDossier(req: AICharacterRequest): Promise<{ dossier: string; isOfflineFallback?: boolean }> {
    try {
      const res = await fetch('/api/ai/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      return { dossier: data.dossier };
    } catch (err: any) {
      console.warn('AI Character API error or offline mode:', err.message);
      return {
        dossier: `### Character Dossier: ${req.characterName}\n\n* **Subject**: Character in *${req.bookTitle}*\n* **Context Mentions**: Identified in active reading selection\n* **Profile**: Core figure contributing to narrative tension and thematic dialogue.\n*(Full AI deep dossier available with active connection).*`,
        isOfflineFallback: true,
      };
    }
  }

  public async summarizeChapter(req: AISummarizeRequest): Promise<{ summary: string; isOfflineFallback?: boolean }> {
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      return { summary: data.summary };
    } catch (err: any) {
      console.warn('AI Summarize API error or offline mode:', err.message);
      return {
        summary: `### Chapter Overview: ${req.chapterTitle}\n\n1. **Executive Summary**: This chapter advances the central premise of *${req.bookTitle}*, introducing core philosophical arguments and dramatic shifts.\n2. **Key Points**: Critical dialogues develop between the protagonists; setting the stage for subsequent revelations.\n3. **Themes**: Time, human potential, and perspective.\n*(Offline mode active).*`,
        isOfflineFallback: true,
      };
    }
  }

  public async explainVocabulary(req: AIVocabularyRequest): Promise<{ result: string; isOfflineFallback?: boolean }> {
    try {
      const res = await fetch('/api/ai/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      return { result: data.result };
    } catch (err: any) {
      console.warn('AI Vocabulary API error or offline mode:', err.message);
      return {
        result: `### "${req.word}"\n\n* **Part of Speech**: Term in context\n* **Contextual Meaning**: Used expressively in: *"${req.sentenceContext || req.word}"*\n* **Reading Tip**: Notice how the author employs this specific diction to convey tone and precision.`,
        isOfflineFallback: true,
      };
    }
  }
}

export const aiService = new AIService();
