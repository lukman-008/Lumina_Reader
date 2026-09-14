const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Add Eye icon to imports
content = content.replace(
  /Maximize, Minimize2, Settings, List, X, Square, Columns2, ScrollText, Moon, Sun, Palette } from 'lucide-react';/,
  `Maximize, Minimize2, Settings, List, X, Square, Columns2, ScrollText, Moon, Sun, Palette, Eye } from 'lucide-react';`
);

// Add forceTextVisible state
content = content.replace(
  /const \[pdfPaperColor, setPdfPaperColor\] = useState<'white' \| 'black' \| 'transparent'>\('white'\);/,
  `const [pdfPaperColor, setPdfPaperColor] = useState<'white' | 'black' | 'transparent'>('white');
  const [forceTextVisible, setForceTextVisible] = useState<boolean>(false);`
);

// Add force text button
const paperToggleRegex = /<button[\s\S]*?PDF Paper Color: \$\{pdfPaperColor\}[\s\S]*?<\/button>/;
const match = content.match(paperToggleRegex);

if (match) {
  const forceTextToggle = `
            <button
              onClick={() => setForceTextVisible(!forceTextVisible)}
              className={\`p-1.5 rounded-lg transition cursor-pointer mr-2 flex items-center gap-1 border \${themeStyle.border} \${forceTextVisible ? 'bg-indigo-500/20 text-indigo-500' : \`hover:bg-black/5 dark:hover:bg-white/10 \${themeStyle.text}\`}\`}
              title="Force High-Contrast Text Layer (Use if PDF canvas is unreadable)"
            >
              <Eye className="w-4 h-4" />
            </button>
  `;
  content = content.replace(match[0], match[0] + '\n' + forceTextToggle);
}

// Add CSS to force text visibility
const documentRegex = /<div style=\{\{ filter: getPdfFilterStyle\(\), transition: 'filter 0\.3s ease' \}\}>/;
content = content.replace(
  documentRegex,
  `<style>{forceTextVisible ? \`
              .react-pdf__Page__textContent, .react-pdf__Page__textContent span, .react-pdf__Page__textContent mark {
                color: \${settings.theme === 'amoled' || settings.theme === 'dusk' ? '#ffffff' : '#000000'} !important;
                opacity: 1 !important;
                background-color: transparent !important;
              }
              .react-pdf__Page__canvas {
                opacity: 0.1 !important; 
              }
            \` : ''}</style>
            <div style={{ filter: getPdfFilterStyle(), transition: 'filter 0.3s ease' }}>`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
