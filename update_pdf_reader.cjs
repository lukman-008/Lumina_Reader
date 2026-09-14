const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Add missing imports
content = content.replace(
  /import { ttsService } from '\.\.\/services\/ttsService';/,
  `import { ttsService } from '../services/ttsService';
import { SoundscapeModal } from './SoundscapeModal';
import { ReadingHabitsDashboard } from './ReadingHabitsDashboard';
import { ReadingProgressBar } from './ReadingProgressBar';
import { TTSAudioBar } from './TTSAudioBar';
import { RSVPModal } from './RSVPModal';`
);

content = content.replace(
  /ScrollText, Moon, Sun, Palette, Eye \} from 'lucide-react';/,
  `ScrollText, Moon, Sun, Palette, Eye, CloudRain, Flame, Volume2, Zap } from 'lucide-react';`
);

// 2. Add state for the new modals right after `const [forceTextVisible, setForceTextVisible] = useState<boolean>(false);`
const stateInsertion = `
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);
  const [isTTSOpen, setIsTTSOpen] = useState(false);
  const [ttsCurrentSentence, setTtsCurrentSentence] = useState('');
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
`;
content = content.replace(
  /const \[forceTextVisible, setForceTextVisible\] = useState<boolean>\(false\);/,
  `const [forceTextVisible, setForceTextVisible] = useState<boolean>(false);${stateInsertion}`
);

// 3. Add TTS logic (like in ReaderView)
const ttsStartLogic = `
  const startTTS = (customText?: string) => {
    // Basic fallback to read selected text or current page if we can extract it
    const textToSpeak = customText || selectedText || "Please highlight text to use Text-to-Speech in PDF mode.";
    ttsService.speakText(textToSpeak, { rate: 1.0 });
    setIsTTSOpen(true);
    setSelectionPosition(null);
  };
`;
// Insert before return
content = content.replace(
  /return \(/,
  `${ttsStartLogic}\n  return (`
);

// 4. Add the buttons to the Top Nav Bar.
// We'll insert them right after `title="Force High-Contrast Text Layer (Use if PDF canvas is unreadable)" > <Eye className="w-4 h-4" /> </button>`
const newButtons = `
            {/* Ambient Soundscapes */}
            <button
              onClick={() => setIsSoundscapeOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="Soundscapes & Warmth (S)"
            >
              <CloudRain className="w-4 h-4" />
            </button>

            {/* Reading Habits & Pomodoro */}
            <button
              onClick={() => setIsHabitsOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="Reading Habits & Focus Timer (H)"
            >
              <Flame className="w-4 h-4 text-amber-500" />
            </button>

            {/* TTS Audio Player button */}
            <button
              onClick={() => startTTS()}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${isTTSOpen ? 'text-amber-500' : themeStyle.text}\`}
              title="Read Aloud with Offline Text-to-Speech"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            
            {/* RSVP Speed Reader */}
            <button
              onClick={() => setIsRSVPOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="RSVP Speed Reader (V)"
            >
              <Zap className="w-4 h-4 text-amber-500" />
            </button>
`;

content = content.replace(
  /title="Force High-Contrast Text Layer \(Use if PDF canvas is unreadable\)"[\s\S]*?<\/button>/,
  `title="Force High-Contrast Text Layer (Use if PDF canvas is unreadable)"
            >
              <Eye className="w-4 h-4" />
            </button>${newButtons}`
);

// 5. Add Modals at the end of the file before `</main>` or just before closing `</div>`
const modals = `
      {/* Soundscape Modal */}
      <SoundscapeModal
        isOpen={isSoundscapeOpen}
        onClose={() => setIsSoundscapeOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Habits Dashboard */}
      <ReadingHabitsDashboard
        isOpen={isHabitsOpen}
        onClose={() => setIsHabitsOpen(false)}
      />

      {/* TTS Audio Player Bar */}
      <TTSAudioBar
        isOpen={isTTSOpen}
        currentSentence={ttsCurrentSentence}
        onClose={() => setIsTTSOpen(false)}
      />

      {/* RSVP Speed Reader Modal */}
      <RSVPModal
        isOpen={isRSVPOpen}
        onClose={() => setIsRSVPOpen(false)}
        text={selectedText || "Please highlight text to use RSVP Speed Reader in PDF mode."}
        title={book.title}
      />
      
      {/* Universal Reading Progress Bar at the bottom */}
      {!isZenMode && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <ReadingProgressBar
            progress={numPages ? (pageNumber / numPages) * 100 : 0}
            theme={settings.theme}
            accentColor={settings.accentColor}
          />
        </div>
      )}
`;

content = content.replace(
  /\{\/\* Selection Popup \*\/\}/,
  `${modals}\n      {/* Selection Popup */}`
);

// 6. Update SelectionPopup onReadAloud to use startTTS
content = content.replace(
  /onReadAloud=\{.*?ttsService\.speakText\(selectedText.*?}/,
  `onReadAloud={() => startTTS(selectedText)}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
