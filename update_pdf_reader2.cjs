const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// I will insert all the required Modals just before the closing </div> (line 948)

const extraModals = `
      {/* Universal Reading Progress Bar at the bottom */}
      {!isZenMode && (
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <ReadingProgressBar
            progress={numPages ? (pageNumber / numPages) * 100 : 0}
            theme={settings.theme}
            accentColor={settings.accentColor}
          />
        </div>
      )}

      {/* Typography Toolbar Popover */}
      <TypographyToolbar
        isOpen={isTypographyOpen}
        onClose={() => setIsTypographyOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

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
`;

content = content.replace(
  /    <\/div>\n  \);\n\}/,
  `${extraModals}\n    </div>\n  );\n}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
