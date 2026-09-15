var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "25mb" }));
var aiClient = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({ apiKey });
  }
  return aiClient;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { question, bookTitle, author, currentChapter, contextText } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in the workspace environment.",
        offlineFallback: true
      });
    }
    const prompt = `You are Lumina AI, an intelligent, spoiler-conscious desktop reading companion for the book "${bookTitle || "the current text"}" by ${author || "the author"}.
The reader is currently reading: "${currentChapter || "the current section"}".

CONTEXT FROM CURRENT CHAPTER / EXCERPT:
"""
${(contextText || "").slice(0, 16e3)}
"""

READER'S QUESTION:
"${question}"

Provide a clear, insightful, literary analysis response. Keep it spoiler-free for events that occur beyond the current chapter. Format nicely with markdown.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    res.json({ answer: response.text });
  } catch (error) {
    console.error("AI Ask Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});
app.post("/api/ai/character", async (req, res) => {
  try {
    const { characterName, bookTitle, currentExcerpt } = req.body;
    if (!characterName) {
      return res.status(400).json({ error: "Character name is required" });
    }
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in the workspace environment.",
        offlineFallback: true
      });
    }
    const prompt = `You are Lumina AI. Provide a structured character dossier for "${characterName}" from the book "${bookTitle || "the current text"}".
Based on this context:
"""
${(currentExcerpt || "").slice(0, 14e3)}
"""

Provide a concise breakdown with:
- **Role & Archetype**: Quick 1-sentence description
- **Key Traits & Personality**: 3 bullet points
- **Known Motivations & Conflicts**: What drives them
- **Key Quotes or Actions**: Notable moments
- **Important Relationships**: Interactions with other figures
Do NOT reveal spoilers beyond what a reader has encountered.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    res.json({ dossier: response.text });
  } catch (error) {
    console.error("AI Character Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze character" });
  }
});
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { chapterTitle, chapterText, bookTitle } = req.body;
    if (!chapterText) {
      return res.status(400).json({ error: "Chapter text is required" });
    }
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in the workspace environment.",
        offlineFallback: true
      });
    }
    const prompt = `Summarize and provide key takeaways for "${chapterTitle || "Chapter"}" from "${bookTitle || "the book"}":

TEXT:
"""
${chapterText.slice(0, 2e4)}
"""

Format response with:
1. **Executive Summary** (2-3 sentences)
2. **Key Plot Points or Arguments** (bulleted)
3. **Themes & Symbolism** (bulleted)
4. **Reflective Question for the Reader**`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    res.json({ summary: response.text });
  } catch (error) {
    console.error("AI Summarize Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate chapter summary" });
  }
});
app.post("/api/ai/vocabulary", async (req, res) => {
  try {
    const { word, sentenceContext, bookTitle } = req.body;
    if (!word) {
      return res.status(400).json({ error: "Word is required" });
    }
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in the workspace environment.",
        offlineFallback: true
      });
    }
    const prompt = `Define the word "${word}" as used specifically in this literary context:
Sentence: "${sentenceContext || word}"
Book: "${bookTitle || "Literary work"}"

Provide:
- **Pronunciation & Part of Speech**
- **Definition in this Context**
- **Etymology / Historical Nuance** (brief)
- **Modern Example Sentence**`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    res.json({ result: response.text });
  } catch (error) {
    console.error("AI Vocabulary Error:", error);
    res.status(500).json({ error: error.message || "Failed to explain word" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : void 0,
        watch: isHmrDisabled ? null : void 0
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lumina Reader server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
