// Vocabulary & Lexicon Service
// Handles instant dictionary definitions, pronunciation, and personal Flashcard Deck storage

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string;
  synonyms?: string[];
  bookId?: string;
  bookTitle?: string;
  contextQuote?: string;
  mastered: boolean;
  addedAt: number;
}

export interface DictionaryLookupResult {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
  }[];
  source: 'online' | 'offline';
}

const STORAGE_KEY = 'lumina_vocabulary_deck_v1';

// Common words dictionary fallback for instant offline lookups
const OFFLINE_LEXICON: Record<string, { pos: string; def: string; ex?: string; pho?: string }> = {
  serendipity: {
    pos: 'noun',
    def: 'The occurrence of events by chance in a happy or beneficial way.',
    ex: 'A fortunate stroke of serendipity brought the two authors together.',
    pho: '/ˌser.ənˈdɪp.ə.ti/',
  },
  ephemeral: {
    pos: 'adjective',
    def: 'Lasting for a very short time; transitory; fleeting.',
    ex: 'The ephemeral beauty of cherry blossoms in early spring.',
    pho: '/ɪˈfem.ər.əl/',
  },
  mellifluous: {
    pos: 'adjective',
    def: 'Sweet or musical; pleasant to hear.',
    ex: 'Her voice possessed a rich, mellifluous timbre.',
    pho: '/məˈlɪf.lu.əs/',
  },
  solitude: {
    pos: 'noun',
    def: 'The state or situation of being alone, especially by choice.',
    ex: 'He savored the tranquil solitude of the early morning study.',
    pho: '/ˈsɒl.ɪ.tʃuːd/',
  },
  eloquence: {
    pos: 'noun',
    def: 'Fluent or persuasive speaking or writing.',
    ex: 'A speaker of great poise and eloquence.',
    pho: '/ˈel.ə.kwəns/',
  },
  petrichor: {
    pos: 'noun',
    def: 'A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather.',
    ex: 'The scent of dry soil drenched in petrichor filled the air.',
    pho: '/ˈpet.rɪ.kɔːr/',
  },
  sonder: {
    pos: 'noun',
    def: 'The profound realization that each random passerby is living a life as vivid and complex as your own.',
    ex: 'Staring out the train window, he felt a wave of sonder.',
    pho: '/ˈsɒn.dər/',
  },
  ubiquitous: {
    pos: 'adjective',
    def: 'Present, appearing, or found everywhere.',
    ex: 'Smartphones have become ubiquitous in modern life.',
    pho: '/juːˈbɪk.wɪ.təs/',
  },
  resilience: {
    pos: 'noun',
    def: 'The capacity to recover quickly from difficulties; toughness.',
    ex: 'Her incredible resilience through hardship inspired everyone.',
    pho: '/rɪˈzɪl.jəns/',
  },
  nostalgia: {
    pos: 'noun',
    def: 'A sentimental longing or wistful affection for the past.',
    ex: 'The faded melody triggered a deep sense of nostalgia.',
    pho: '/nɒsˈtæl.dʒə/',
  },
};

class VocabularyService {
  private words: VocabularyWord[] = [];
  private listeners: ((words: VocabularyWord[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.words = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to load vocabulary deck from localStorage:', err);
      this.words = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.words));
      this.notifyListeners();
    } catch (err) {
      console.warn('Failed to save vocabulary deck to localStorage:', err);
    }
  }

  public getWords(): VocabularyWord[] {
    return [...this.words];
  }

  public isWordSaved(rawWord: string): boolean {
    const clean = rawWord.trim().toLowerCase();
    return this.words.some((w) => w.word.toLowerCase() === clean);
  }

  public saveWord(wordData: Omit<VocabularyWord, 'id' | 'addedAt' | 'mastered'>): VocabularyWord {
    const cleanWord = wordData.word.trim();
    const existingIndex = this.words.findIndex(
      (w) => w.word.toLowerCase() === cleanWord.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing word entry
      this.words[existingIndex] = {
        ...this.words[existingIndex],
        ...wordData,
        word: cleanWord,
      };
      this.saveToStorage();
      return this.words[existingIndex];
    }

    const newWord: VocabularyWord = {
      ...wordData,
      id: 'vocab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      word: cleanWord,
      mastered: false,
      addedAt: Date.now(),
    };

    this.words.unshift(newWord);
    this.saveToStorage();
    return newWord;
  }

  public toggleMastered(id: string): boolean {
    const item = this.words.find((w) => w.id === id);
    if (!item) return false;
    item.mastered = !item.mastered;
    this.saveToStorage();
    return item.mastered;
  }

  public deleteWord(id: string) {
    this.words = this.words.filter((w) => w.id !== id);
    this.saveToStorage();
  }

  public subscribe(listener: (words: VocabularyWord[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.words]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const copy = [...this.words];
    this.listeners.forEach((l) => l(copy));
  }

  // Lookup word via Free Dictionary API with offline fallback
  public async lookup(query: string): Promise<DictionaryLookupResult> {
    const cleanWord = query.trim().replace(/[.,!?;:"'()\[\]{}]+$/g, '').replace(/^[.,!?;:"'()\[\]{}]+/g, '').toLowerCase();

    // 1. Try public free dictionary API (standard open dictionary endpoint)
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          let audioUrl: string | undefined;

          // Find first valid audio file URL
          if (Array.isArray(entry.phonetics)) {
            for (const p of entry.phonetics) {
              if (p.audio && typeof p.audio === 'string' && p.audio.trim().length > 0) {
                audioUrl = p.audio.startsWith('//') ? `https:${p.audio}` : p.audio;
                break;
              }
            }
          }

          const meanings = (entry.meanings || []).map((m: { partOfSpeech: string; definitions: { definition: string; example?: string; synonyms?: string[] }[] }) => ({
            partOfSpeech: m.partOfSpeech || 'definition',
            definitions: (m.definitions || []).slice(0, 3).map((d) => ({
              definition: d.definition,
              example: d.example,
              synonyms: d.synonyms?.slice(0, 4),
            })),
          }));

          return {
            word: entry.word || cleanWord,
            phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
            audioUrl,
            meanings,
            source: 'online',
          };
        }
      }
    } catch {
      // Ignore network errors, fall through to offline heuristics
    }

    // 2. Offline fallback dictionary
    const offlineMatch = OFFLINE_LEXICON[cleanWord];
    if (offlineMatch) {
      return {
        word: cleanWord,
        phonetic: offlineMatch.pho,
        meanings: [
          {
            partOfSpeech: offlineMatch.pos,
            definitions: [
              {
                definition: offlineMatch.def,
                example: offlineMatch.ex,
              },
            ],
          },
        ],
        source: 'offline',
      };
    }

    // 3. Fallback generic card with intelligent suffix guessing
    let guessedPos = 'term';
    if (cleanWord.endsWith('ly')) guessedPos = 'adverb';
    else if (cleanWord.endsWith('tion') || cleanWord.endsWith('ness') || cleanWord.endsWith('ment')) guessedPos = 'noun';
    else if (cleanWord.endsWith('ful') || cleanWord.endsWith('ous') || cleanWord.endsWith('ive') || cleanWord.endsWith('ic')) guessedPos = 'adjective';
    else if (cleanWord.endsWith('ed') || cleanWord.endsWith('ing')) guessedPos = 'verb';

    return {
      word: cleanWord,
      meanings: [
        {
          partOfSpeech: guessedPos,
          definitions: [
            {
              definition: `A noteworthy literary term or vocabulary word found in the book.`,
            },
          ],
        },
      ],
      source: 'offline',
    };
  }

  // Pronounce word using browser speech synthesis
  public speak(word: string) {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // ignore
    }
  }

  // Export to Anki CSV format
  public exportAsAnkiCSV(): string {
    const lines = ['#separator:Tab', '#html:true', '#tags column:4'];
    this.words.forEach((w) => {
      const front = `<strong>${w.word}</strong>${w.phonetic ? ` <span style="color:#888;">${w.phonetic}</span>` : ''}`;
      const back = `<em>(${w.partOfSpeech || 'term'})</em> ${w.definition}${w.example ? `<br><small>“${w.example}”</small>` : ''}${w.contextQuote ? `<br><small style="color:#aaa;">Context: “${w.contextQuote}”</small>` : ''}`;
      const tags = `lumina ${w.bookTitle ? w.bookTitle.replace(/\s+/g, '_') : 'reading'}`;
      lines.push(`${front}\t${back}\t${tags}`);
    });
    return lines.join('\n');
  }

  // Export as formatted Markdown list
  public exportAsMarkdown(): string {
    const lines = [
      '# Lumina Vocabulary & Flashcards Deck',
      `*Exported on ${new Date().toLocaleDateString()} — ${this.words.length} saved words*\n`,
    ];

    this.words.forEach((w, i) => {
      lines.push(`### ${i + 1}. **${w.word}** ${w.phonetic ? `*(${w.phonetic})*` : ''}`);
      lines.push(`- **Part of Speech**: *${w.partOfSpeech || 'term'}*`);
      lines.push(`- **Definition**: ${w.definition}`);
      if (w.example) lines.push(`- **Example**: *“${w.example}”*`);
      if (w.contextQuote) lines.push(`- **Book Context**: *“${w.contextQuote}”* (${w.bookTitle || 'Book'})`);
      lines.push(`- **Status**: ${w.mastered ? '✅ Mastered' : '⏳ In Progress'}\n`);
    });

    return lines.join('\n');
  }
}

export const vocabularyService = new VocabularyService();
