const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Remove from Zen Mode (approx lines 555-575)
content = content.replace(/<button[\s\S]*?PDF Paper Color: \$\{pdfPaperColor\}[\s\S]*?<\/button>\s*<button[\s\S]*?Force High-Contrast Text Layer[\s\S]*?<\/button>\s*/, '');

// Re-inject next to PDF Appearance
const targetBtn = `<button
              onClick={() => {
                const themes: ('light' | 'dark' | 'sepia')[] = ['light', 'dark', 'sepia'];
                const idx = themes.indexOf(pdfFilterTheme);
                setPdfFilterTheme(themes[(idx + 1) % themes.length]);
              }}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer mr-1 flex items-center gap-1 border \${themeStyle.border} \${themeStyle.text}\`}
              title={\`PDF Appearance: \${pdfFilterTheme}\`}
            >
              {pdfFilterTheme === 'dark' ? <Moon className="w-4 h-4" /> : pdfFilterTheme === 'sepia' ? <Palette className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>`;

const newBtns = `<button
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
            <button
              onClick={() => setForceTextVisible(!forceTextVisible)}
              className={\`p-1.5 rounded-lg transition cursor-pointer mr-2 flex items-center gap-1 border \${themeStyle.border} \${forceTextVisible ? 'bg-indigo-500/20 text-indigo-500' : \`hover:bg-black/5 dark:hover:bg-white/10 \${themeStyle.text}\`}\`}
              title="Force High-Contrast Text Layer (Use if PDF canvas is unreadable)"
            >
              <Eye className="w-4 h-4" />
            </button>
`;

content = content.replace(targetBtn, newBtns + targetBtn);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
