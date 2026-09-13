const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Add Minimize2 import
content = content.replace(
  /Maximize, Settings, List, X, Square, Columns2, ScrollText \} from 'lucide-react';/,
  `Maximize, Minimize2, Settings, List, X, Square, Columns2, ScrollText } from 'lucide-react';`
);

// 2. Add Escape and Z handler in handleKeyDown
content = content.replace(
  /    \} else if \(e\.key === 'ArrowLeft'\) \{\n      e\.preventDefault\(\);\n      changePage\(-1\);\n    \}\n  \};/,
  `    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      changePage(-1);
    } else if (e.key === 'Escape') {
      if (isZenMode) onToggleZenMode();
      setIsTOCOpen(false);
      setIsAIOpen(false);
    } else if (e.key === 'z' || e.key === 'Z') {
      onToggleZenMode();
    }
  };`
);

// 3. Add Zen Mode Exit Overlay before Top Nav Bar
const overlay = `      {/* Zen Mode / Full Screen Exit Overlay */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-50 transition-opacity duration-300 opacity-30 hover:opacity-100">
          <button
            onClick={onToggleZenMode}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700/50 backdrop-blur-md shadow-lg cursor-pointer"
            title="Exit Zen Mode (Esc)"
          >
            <Minimize2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Exit Fullscreen <kbd className="ml-1 opacity-60 font-sans">Esc</kbd></span>
          </button>
        </div>
      )}
`;

content = content.replace(
  /      \{\/\* Top Nav Bar \*\/\}/,
  overlay + '\n      {/* Top Nav Bar */}'
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
