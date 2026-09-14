const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Add state for paper color
content = content.replace(
  /const \[pdfFilterTheme, setPdfFilterTheme\] = useState<'light' \| 'dark' \| 'sepia'>\('light'\);/,
  `const [pdfFilterTheme, setPdfFilterTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [pdfPaperColor, setPdfPaperColor] = useState<'white' | 'black' | 'transparent'>('white');`
);

// Add button for paper color toggle next to filter toggle
const filterToggleRegex = /<button[\s\S]*?PDF Appearance: \$\{pdfFilterTheme\}[\s\S]*?<\/button>/;
const match = content.match(filterToggleRegex);

if (match) {
  const paperToggle = `
            <button
              onClick={() => {
                const colors: ('white' | 'black' | 'transparent')[] = ['white', 'black', 'transparent'];
                const idx = colors.indexOf(pdfPaperColor);
                setPdfPaperColor(colors[(idx + 1) % colors.length]);
              }}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer mr-1 flex items-center gap-1 border \${themeStyle.border} \${themeStyle.text}\`}
              title={\`PDF Paper Color: \${pdfPaperColor}\`}
            >
              <div className="w-4 h-4 rounded-sm border border-gray-400" style={{ background: pdfPaperColor === 'transparent' ? 'repeating-conic-gradient(#80808033 0% 25%, transparent 0% 50%) 50% / 8px 8px' : pdfPaperColor }}></div>
            </button>
  `;
  content = content.replace(match[0], paperToggle + '\n' + match[0]);
}

// Replace bg-white with dynamic class
content = content.replace(/className="shadow-xl bg-white max-w-full overflow-hidden"/g, `className={\`shadow-xl max-w-full overflow-hidden \${pdfPaperColor === 'white' ? 'bg-white' : pdfPaperColor === 'black' ? 'bg-black' : 'bg-transparent'}\`}`);
content = content.replace(/className="shadow-xl bg-white overflow-hidden flex-shrink-0"/g, `className={\`shadow-xl overflow-hidden flex-shrink-0 \${pdfPaperColor === 'white' ? 'bg-white' : pdfPaperColor === 'black' ? 'bg-black' : 'bg-transparent'}\`}`);
content = content.replace(/className="max-w-full overflow-hidden flex justify-center bg-white shadow-xl"/g, `className={\`max-w-full overflow-hidden flex justify-center shadow-xl \${pdfPaperColor === 'white' ? 'bg-white' : pdfPaperColor === 'black' ? 'bg-black' : 'bg-transparent'}\`}`);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
