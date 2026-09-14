const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Add Sun/Moon icons to imports
content = content.replace(
  /Maximize, Minimize2, Settings, List, X, Square, Columns2, ScrollText \} from 'lucide-react';/,
  `Maximize, Minimize2, Settings, List, X, Square, Columns2, ScrollText, Moon, Sun, Palette } from 'lucide-react';`
);

// 2. Add state for PDF Theme
content = content.replace(
  /const \[scale, setScale\] = useState<number>\(1\.0\);/,
  `const [scale, setScale] = useState<number>(1.0);
  const [pdfFilterTheme, setPdfFilterTheme] = useState<'light' | 'dark' | 'sepia'>('light');`
);

// 3. Add toggle button before the layout toggle
const layoutToggle = `{/* Quick layout toggle specifically for PDF reader */}`;
const themeToggle = `            <button
              onClick={() => {
                const themes: ('light' | 'dark' | 'sepia')[] = ['light', 'dark', 'sepia'];
                const idx = themes.indexOf(pdfFilterTheme);
                setPdfFilterTheme(themes[(idx + 1) % themes.length]);
              }}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer mr-1 flex items-center gap-1 border \${themeStyle.border} \${themeStyle.text}\`}
              title={\`PDF Appearance: \${pdfFilterTheme}\`}
            >
              {pdfFilterTheme === 'dark' ? <Moon className="w-4 h-4" /> : pdfFilterTheme === 'sepia' ? <Palette className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
`;
content = content.replace(layoutToggle, themeToggle + '\n            ' + layoutToggle);

// 4. Compute filter style
const filterLogic = `
  const getPdfFilterStyle = () => {
    switch (pdfFilterTheme) {
      case 'dark': return 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.1)';
      case 'sepia': return 'sepia(0.6) contrast(0.9) brightness(0.9)';
      default: return 'none';
    }
  };
`;
content = content.replace(
  /const themeStyle = useMemo\(\(\) => \{/,
  filterLogic + `\n  const themeStyle = useMemo(() => {`
);

// 5. Apply filter style to Document wrapper
content = content.replace(
  /<Document suspense=\{false\}/,
  `<div style={{ filter: getPdfFilterStyle(), transition: 'filter 0.3s ease' }}>
            <Document suspense={false}`
);
content = content.replace(
  /<\/Document>\n\s*<\/div>\n\s*\)}/,
  `</Document>\n            </div>\n          </div>\n        )}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
