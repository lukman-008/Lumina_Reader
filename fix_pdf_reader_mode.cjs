const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Add BookOpen icon and state
content = content.replace(
  /Zap, Sliders \} from 'lucide-react';/,
  `Zap, Sliders, BookOpen } from 'lucide-react';`
);

content = content.replace(
  /const \[forceTextVisible, setForceTextVisible\] = useState<boolean>\(false\);/,
  `const [pdfViewMode, setPdfViewMode] = useState<'canvas' | 'reader'>('canvas');
  const [extractedPageText, setExtractedPageText] = useState<Record<number, string[]>>({});
  const [isExtractingText, setIsExtractingText] = useState(false);`
);

// 2. Add text extraction logic
const extractionLogic = `
  // Extract text for Reader Mode
  useEffect(() => {
    if (pdfViewMode !== 'reader' || !fileData) return;
    
    const extractTextForPage = async (pageNum: number) => {
      if (extractedPageText[pageNum]) return;
      
      try {
        setIsExtractingText(true);
        const pdf = await pdfjs.getDocument(fileData).promise;
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const items = textContent.items as any[];
        // Sort items by Y descending, then X ascending
        items.sort((a, b) => {
          if (Math.abs(b.transform[5] - a.transform[5]) > 5) {
            return b.transform[5] - a.transform[5]; // Y descending (PDF coordinates)
          }
          return a.transform[4] - b.transform[4]; // X ascending
        });

        let paragraphs: string[] = [];
        let currentPar = '';
        let lastY: number | null = null;

        for (const item of items) {
          const y = item.transform[5];
          if (lastY !== null && Math.abs(lastY - y) > 12) {
            if (currentPar.trim()) {
              if (currentPar.trim().endsWith('-')) {
                currentPar = currentPar.trim().slice(0, -1) + item.str.trim();
              } else {
                paragraphs.push(currentPar.trim());
                currentPar = item.str;
              }
            } else {
               currentPar = item.str;
            }
          } else {
            currentPar += (currentPar ? ' ' : '') + item.str;
          }
          lastY = y;
        }
        if (currentPar.trim()) paragraphs.push(currentPar.trim());

        setExtractedPageText(prev => ({ ...prev, [pageNum]: paragraphs }));
      } catch (e) {
        console.error("Extraction error:", e);
      } finally {
        setIsExtractingText(false);
      }
    };

    extractTextForPage(pageNumber);
    if (settings.layoutMode === 'double' && pageNumber + 1 <= numPages) {
      extractTextForPage(pageNumber + 1);
    }
  }, [pdfViewMode, pageNumber, fileData, settings.layoutMode, numPages, extractedPageText]);

  // Bionic reading word transformation helper
  const formatBionicText = (text: string) => {
    if (!settings.bionicReading) return text;
    return text.split(' ').map((word, i) => {
      const mid = Math.ceil(word.length * 0.45);
      const boldPart = word.slice(0, mid);
      const rest = word.slice(mid);
      return (
        <React.Fragment key={i}>
          <span className="font-extrabold opacity-95">{boldPart}</span>
          <span>{rest} </span>
        </React.Fragment>
      );
    });
  };
`;

content = content.replace(
  /  \/\/ Selection popup states/,
  `${extractionLogic}\n  // Selection popup states`
);

// 3. Replace the Eye button with BookOpen button
const oldButton = /<button[\s\S]*?onClick=\{\(\) => setForceTextVisible\(!forceTextVisible\)\}[\s\S]*?<\/button>/;
const newButton = `<button
              onClick={() => setPdfViewMode(prev => prev === 'canvas' ? 'reader' : 'canvas')}
              className={\`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 border \${themeStyle.border} \${pdfViewMode === 'reader' ? 'bg-amber-500/20 text-amber-500' : \`hover:bg-black/5 dark:hover:bg-white/10 \${themeStyle.text}\`}\`}
              title="Reader Mode (Extract raw text for perfect readability)"
            >
              <BookOpen className="w-4 h-4" />
            </button>`;

content = content.replace(oldButton, newButton);

// 4. Update the content area to render the reader mode text if pdfViewMode === 'reader'
const oldStyles = /<style>\{forceTextVisible \? `[\s\S]*?` : ''\}<\/style>/;
content = content.replace(oldStyles, '');

// Create the Reader view JSX
const readerViewRender = `{pdfViewMode === 'reader' ? (
              <div className={\`w-full h-full overflow-y-auto px-6 py-12 flex justify-center \${themeStyle.bg}\`}>
                <div 
                  className={\`max-w-3xl w-full flex flex-col gap-6 \${settings.fontFamily} \${themeStyle.text}\`}
                  style={{
                    fontSize: \`\${settings.fontSize}px\`,
                    lineHeight: settings.lineHeight,
                    textAlign: settings.textAlign as any
                  }}
                >
                  {isExtractingText && !extractedPageText[pageNumber] ? (
                    <div className="flex justify-center items-center h-40 opacity-60">Extracting text...</div>
                  ) : (
                    <>
                      {extractedPageText[pageNumber]?.map((p, i) => (
                        <p key={\`p1-\${i}\`} className="indent-6">{formatBionicText(p)}</p>
                      ))}
                      {settings.layoutMode === 'double' && pageNumber + 1 <= numPages && extractedPageText[pageNumber + 1]?.map((p, i) => (
                        <p key={\`p2-\${i}\`} className="indent-6">{formatBionicText(p)}</p>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : (`;

const closeReaderView = `)}
          </Document>`;

content = content.replace(
  /<div className="flex flex-col gap-6 items-center w-full max-w-full">/,
  `${readerViewRender}\n                <div className="flex flex-col gap-6 items-center w-full max-w-full">`
);

content = content.replace(
  /<\/div>\s*<\/Document>/,
  `</div>\n            ${closeReaderView}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
