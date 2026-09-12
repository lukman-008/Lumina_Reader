# Lumina Reader

> **An elegant, offline-first cross-platform desktop reading software and study companion** built with React 19, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), and Google Gemini AI.

---

## 🌟 Overview

**Lumina Reader** is a modern, privacy-respecting e-reader engineered for focused reading, deep research, and distraction-free study. It operates 100% offline using local browser storage (IndexedDB) for your books, progress, bookmarks, and annotations. When connected to the internet, it unlocks an AI reading companion powered by Gemini to help you analyze chapters, map characters, explain historical context, and synthesize complex ideas.

---

## ✨ Key Features

### 📖 Reading Experience & Typography
- **Format Support**: Seamlessly import and read **EPUB**, **TXT**, **Markdown (`.md`)**, **HTML**, and extracted text documents.
- **Deep Search Index (`⌘K`)**: Instant full-text fuzzy and exact search across your entire personal library with chapter jumping and highlighted matching snippets.
- **Batch File Importer**: Drag-and-drop or select multiple EPUBs, Markdown files, or paste raw web articles directly into custom bookshelves with auto-tagging.
- **Cross-Device Progress Sync**: Peer-to-peer and code-based progress synchronization allowing you to transfer your reading position, percentages, and annotations across machines without third-party servers.
- **Comprehensive Annotation Manager (`⌘+Shift+A`)**: Dedicated central workspace to search, filter by color or scope (word, sentence, paragraph), edit notes, and export study summaries to Markdown.
- **Targeted Selection Notes**: Select any word, line, or paragraph while reading to highlight with custom palettes (Gold, Mint, Sky, Rose, Orange, Purple) and attach contextual reflection notes.
- **Flexible Library Layout**: Switch effortlessly between visual 3D book cover cards and high-density tabular list view with sorting by Recently Read, Title, Author, Reading Progress, or Word Count.
- **Curated Font Typography**:
  - **Literata**: Classic digital editorial serif designed for continuous book reading.
  - **Merriweather**: High-contrast, sturdy book face with generous x-height.
  - **Atkinson Hyperlegible / OpenDyslexic**: Specially tuned for visual clarity and accessibility.
  - **Plus Jakarta Sans**: Clean geometric sans-serif for contemporary reading.
  - **JetBrains Mono**: Monospace typography optimized for code-heavy texts and technical manuals.
- **Multiple Reading Layouts**:
  - **Single Page**: Traditional clean reading sheet with page turns.
  - **Two-Column Spread**: Classic open-book dual column view for wide monitors.
  - **Continuous Vertical Scroll**: Fluid web-style scrolling.
- **Bionic Reading Mode**: Highlights the initial letters of each word to guide saccadic eye movements and increase reading velocity.
- **Interactive Reading Ruler**: A subtle floating focus bar that tracks your cursor or touches to guide reading lines and eliminate eye strain.

### 🎨 Themes & Circadian Eye Comfort
- **6 Handcrafted Reading Palettes**:
  - **Paper**: Soft editorial cream (`#faf8f5`) with gentle contrast.
  - **Sepia**: Warm parchment tone (`#f4ecd8`) for cozy long reading sessions.
  - **Nordic Slate**: Modern dusk dark mode (`#181b22`) for low-glare nighttime reading.
  - **Sage Forest**: Soothing organic green (`#111b15`) engineered to relax eye muscles.
  - **Midnight AMOLED**: True 100% black (`#000000`) for maximum contrast and OLED battery savings.
  - **E-Ink Monochrome**: Pure high-contrast black-and-white (`#ffffff`) inspired by physical e-readers.
- **Circadian Warmth Engine**: Automatic blue-light temperature adjustment that dynamically warms the canvas at sunset or can be manually dialed from 0% to 100%.
- **Accent Color Themes**: Personalize interface highlights across **Amber Gold**, **Emerald Mint**, **Azure Sky**, **Rose Blossom**, and **Amethyst Violet**.
- **Distraction-Free Zen Mode**: Toggle with a single key (`Z`) to hide all chrome, toolbars, and menus for pure immersion.

### ⚡ Speed Reading & Focus
- **RSVP Speed Reader (Rapid Serial Visual Presentation)**:
  - Streams words at the exact focal point using Optimal Recognition Point (ORP) fixation highlighting.
  - Adjustable speed from 150 to 900+ words per minute (WPM).
  - Quick keyboard controls for pausing, rewinding sentences, and adjusting pacing.
- **Auto-Pacing Mode**: Automatically advances pages at your calculated target reading pace without manual clicks.

### 🎧 Ambient Soundscapes & Offline Text-to-Speech
- **Synthesized Ambient Audio**: Built-in soundscapes generated via the Web Audio API without requiring external audio downloads:
  - 🌧️ Gentle Rain
  - 🌲 Forest Birds & Breeze
  - ☕ Coffee House Ambience
  - 🌊 Ocean Waves
  - 📻 Gentle White Noise
- **Offline Text-to-Speech (TTS)**: Native browser speech engine (`window.speechSynthesis`) with real-time sentence-by-sentence tracking, play/pause controls, and rate adjustments.

### ✏️ Annotations, Notebook & Study Suite
- **Multi-Color In-Text Highlighting**: Select any passage to highlight in **Gold**, **Mint**, **Sky**, **Rose**, **Orange**, or **Purple**.
- **Interactive Highlight Popovers**: Click any highlighted passage to change colors, add personal reflection notes, copy text, or ask the AI assistant about it.
- **Tactile Bookmark Ribbons**: Clickable corner ribbon dog-ear markers for quick page marking with inline editable labels.
- **Comprehensive Notebook Drawer**:
  - Filter highlights by color or search across quotes and notes.
  - One-click jump to the exact book, chapter, and page position.
  - **Export to Markdown (`.md`)**: Export your notes and highlighted quotes directly for Notion, Obsidian, or local archiving.

### 🤖 Gemini-Powered AI Reading Companion
- Connected through a secure server-side Express proxy using `@google/genai`:
  - **Chapter Summarizer**: Generate scannable bullet points and core takeaways.
  - **Contextual Inquiries**: Highlight difficult terminology, historical references, or archaic phrases to receive instant, lucid explanations.
  - **Character & Concept Analysis**: Trace relationships, character motivations, and thematic motifs across chapters.
  - **Ask Custom Questions**: Converse directly with an AI tutor grounded in your book's text.

### 📊 Reading Habits & Focus Timer
- **Automatic Habit Tracking**: Tracks daily reading streaks, total minutes read, pages turned, and words completed.
- **Integrated Pomodoro Focus Timer**: Customizable 25-minute reading intervals with audible chimes to build consistent reading routines.
- **Library Organization**: Organize books with custom Shelves, Reading Status tags (Want to Read, Currently Reading, Completed), and search filters.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion |
| **Icons & Design** | Lucide React, Modern Typographic Scale, Responsive Desktop Titlebar |
| **Local Storage** | Dexie.js (Wrapper for IndexedDB) — 100% offline-first |
| **Server / Proxy** | Node.js, Express 4, `tsx`, `esbuild` |
| **AI Integration** | Google Gemini API (`@google/genai` via secure server-side routes) |
| **Audio Engines** | Web Audio API (ambient noise synthesis), Web Speech API (offline TTS) |

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js**: Version 18.0.0 or higher (Node 20+ recommended)
- **npm** or **pnpm** / **yarn**
- *(Optional)* A **Google Gemini API Key** for AI features (get one free at [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/lumina-reader.git
cd lumina-reader
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key (optional for basic reading, required for AI reading companion features):
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📦 Building for Production

### Build the Application
To compile the client frontend and bundle the server into a self-contained executable:
```bash
npm run build
```

This runs:
1. `vite build` to generate the client assets in `/dist`.
2. `esbuild server.ts` to bundle the backend Express server into `/dist/server.cjs`.

### Start the Production Server
```bash
npm start
```
The server will boot and serve the production application on `http://localhost:3000`.

---

## 🖥️ Desktop Application Packaging (Optional)

Lumina Reader includes a native desktop window titlebar and offline database, making it ready to package as a native desktop application for macOS, Windows, and Linux via Electron:

```bash
# Package the desktop application
npm run package:desktop
```

---

## ⌨️ Keyboard Shortcuts Reference

Lumina Reader provides an extensive set of keyboard shortcuts designed for fluid desktop reading:

| Action | Shortcut |
|---|---|
| **Next Page** | <kbd>→</kbd> / <kbd>Space</kbd> / <kbd>PageDown</kbd> / <kbd>J</kbd> |
| **Previous Page** | <kbd>←</kbd> / <kbd>Shift+Space</kbd> / <kbd>PageUp</kbd> / <kbd>K</kbd> |
| **Toggle Zen Mode** | <kbd>Z</kbd> |
| **Toggle Reading Ruler** | <kbd>R</kbd> |
| **Open RSVP Speed Reader** | <kbd>V</kbd> |
| **Toggle Auto-Pacing** | <kbd>P</kbd> |
| **Open Soundscapes & Warmth** | <kbd>S</kbd> |
| **Open Reading Habits & Pomodoro** | <kbd>H</kbd> |
| **Deep Search Index (All Books)** | <kbd>Ctrl+K</kbd> / <kbd>⌘+K</kbd> |
| **Global Annotation & Notes Manager** | <kbd>Ctrl+Shift+A</kbd> / <kbd>⌘+Shift+A</kbd> |
| **Bookmark / Unbookmark Page** | <kbd>Ctrl+B</kbd> / <kbd>⌘+B</kbd> |
| **Search Within Book** | <kbd>Ctrl+F</kbd> / <kbd>⌘+F</kbd> |
| **Table of Contents** | <kbd>Ctrl+T</kbd> / <kbd>⌘+T</kbd> |
| **Notebook & Highlights** | <kbd>Ctrl+H</kbd> / <kbd>⌘+H</kbd> |
| **Ask AI Reading Companion** | <kbd>Ctrl+A</kbd> / <kbd>⌘+A</kbd> |
| **Close Open Modal / Drawer** | <kbd>Esc</kbd> |

---

## 📂 Project Structure

```text
lumina-reader/
├── public/                 # Static assets, icons, and sample books
├── src/
│   ├── components/         # Modular React UI components
│   │   ├── AIAssistantDrawer.tsx       # AI book analysis & Q&A drawer
│   │   ├── AnnotationManagerModal.tsx  # Central highlights & study notes organizer
│   │   ├── BackupRestoreModal.tsx      # .lumina complete database export/import
│   │   ├── DesktopExportModal.tsx      # Tauri/Electron desktop build guide
│   │   ├── DesktopTitleBar.tsx         # Cross-platform desktop window frame
│   │   ├── FileImporterModal.tsx       # Multi-format drag-and-drop batch importer
│   │   ├── HighlightPopover.tsx        # Floating in-text annotation popover
│   │   ├── LibraryView.tsx             # Home book library, shelves & importer
│   │   ├── ReaderDrawers.tsx           # Table of contents & Notebook drawer
│   │   ├── ReaderView.tsx              # Primary reading canvas & viewport
│   │   ├── ReadingHabitsDashboard.tsx  # Habits, streaks & Pomodoro timer
│   │   ├── ReadingProgressBar.tsx      # Scrubbable chapter progress bar
│   │   ├── ReadingProgressSyncModal.tsx# Cross-device sync code & backup transfer
│   │   ├── RSVPModal.tsx               # Speed reading engine
│   │   ├── SearchIndexModal.tsx        # Library-wide deep search index launcher
│   │   ├── SelectionPopup.tsx          # Quick highlight, note & text-action popup
│   │   ├── ShortcutsModal.tsx          # Interactive keyboard shortcuts reference
│   │   ├── SoundscapeModal.tsx         # Synthesized ambient audio generator
│   │   ├── TTSAudioBar.tsx             # Offline speech player
│   │   └── TypographyToolbar.tsx       # Font & theme customizer
│   ├── services/           # Core background engines & services
│   │   ├── audioService.ts             # Web Audio ambient sound synthesizer
│   │   ├── bookParser.ts               # EPUB, Markdown, TXT & HTML parsers
│   │   ├── db.ts                       # Dexie IndexedDB schemas & persistent settings
│   │   ├── habitTracker.ts             # Reading session & analytics tracker
│   │   ├── progressSyncService.ts      # Reading progress sync & code engine
│   │   ├── searchIndexService.ts       # Full-text inverted search index
│   │   └── ttsService.ts               # Offline Web Speech API service
│   ├── App.tsx             # Root view coordinator & state orchestrator
│   ├── index.css           # Tailwind CSS directives & font definitions
│   ├── main.tsx            # React application entry point
│   └── types.ts            # Global TypeScript models & interfaces
├── index.html              # HTML shell with Google Fonts & typography
├── package.json            # Scripts and project dependencies
├── server.ts               # Express backend & Gemini API proxy
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build pipeline
```

---

## 🔒 Privacy & Local Storage Guarantee

All personal reading data—including your imported files, current reading positions, bookmarks, highlights, reflection notes, and reading statistics—is stored exclusively on your device using IndexedDB. No book contents or notes are uploaded to any external server unless you explicitly click **Ask AI** to request assistance on a specific passage.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
