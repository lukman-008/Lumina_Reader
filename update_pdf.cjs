const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Add pdfViewMode state
const stateInsert = `
  const [pdfViewMode, setPdfViewMode] = useState<'native' | 'reader'>('native');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  const extractCurrentPages = useCallback(async () => {
    if (!pdfDoc) return;
    setIsExtracting(true);
    try {
      let combinedText = '';
      const pagesToExtract = [pageNumber];
      if (settings.layoutMode === 'double' && pageNumber + 1 <= numPages) {
        pagesToExtract.push(pageNumber + 1);
      }
      
      for (const p of pagesToExtract) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        
        let lastY;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === undefined || Math.abs(lastY - item.transform[5]) < 5) {
             text += item.str + ' ';
          } else {
             text += '\\n' + item.str + ' ';
          }    
          lastY = item.transform[5];
        }
        
        let cleanText = text;
        
        // Clean hyphenation across lines
        cleanText = cleanText.replace(/([a-zA-Z])-\\s*\\n\\s*([a-zA-Z])/g, '$1$2');
        
        // Join lines that shouldn't be broken (lowercase letter on next line implies continuation)
        cleanText = cleanText.replace(/([^\\.?!\\n])\\s*\\n\\s*([a-z])/g, '$1 $2');
        
        // Clean up excessive spaces
        cleanText = cleanText.replace(/ {2,}/g, ' ');
        
        // Remove lines that are just a single number (often page numbers)
        cleanText = cleanText.replace(/^\\s*[0-9]+\\s*$/gm, '');
        
        // Standardize paragraphs
        cleanText = cleanText.replace(/\\n{2,}/g, '\\n\\n');
        
        combinedText += cleanText.trim() + '\\n\\n\\n';
      }
      setExtractedText(combinedText);
    } catch (e) {
      console.error(e);
      setExtractedText("Failed to extract text from this page. This PDF might be an image without an OCR layer.");
    } finally {
      setIsExtracting(false);
    }
  }, [pdfDoc, pageNumber, settings.layoutMode, numPages]);

  useEffect(() => {
    if (pdfViewMode === 'reader' && pdfDoc) {
      extractCurrentPages();
    }
  }, [pdfViewMode, pageNumber, pdfDoc, settings.layoutMode, extractCurrentPages]);

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

content = content.replace('  const [pdfFilterTheme, setPdfFilterTheme] = useState<\'light\' | \'dark\' | \'sepia\'>(\'light\');', '  const [pdfFilterTheme, setPdfFilterTheme] = useState<\'light\' | \'dark\' | \'sepia\'>(\'light\');\n' + stateInsert);

// 2. Set pdfDoc in onLoadSuccess
content = content.replace('setNumPages(pdf.numPages);', 'setNumPages(pdf.numPages);\n    setPdfDoc(pdf);');


// 3. Add toggle button
const toggleBtn = `
            <button
              onClick={() => setPdfViewMode(m => m === 'native' ? 'reader' : 'native')}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border \${themeStyle.border} \${themeStyle.text}\`}
              title={\`Switch to \${pdfViewMode === 'native' ? 'Reader' : 'Native'} Mode\`}
            >
              {pdfViewMode === 'native' ? <BookOpen className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs font-medium">{pdfViewMode === 'native' ? 'Reader' : 'Native'}</span>
            </button>
            
            <div className="w-px h-6 bg-slate-500/30 mx-1"></div>
`;

content = content.replace('<button\n              onClick={() => {\n                const themes:', toggleBtn + '\n            <button\n              onClick={() => {\n                const themes:');


// 4. Render Reader Mode
const renderReplacement = `
        {!pdfUrl ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            <p>Loading High-Fidelity PDF Engine...</p>
          </div>
        ) : pdfViewMode === 'reader' ? (
          <div className="w-full max-w-3xl px-8 py-12 md:py-16 mx-auto relative transition-all duration-300">
            {isExtracting ? (
               <div className="flex justify-center items-center h-64 opacity-50">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                 <p className="ml-3">Extracting text layout...</p>
               </div>
            ) : extractedText ? (
              <div 
                className={\`prose prose-lg dark:prose-invert max-w-none \${
                  settings.fontFamily === 'literata' ? 'font-literata' :
                  settings.fontFamily === 'merriweather' ? 'font-merriweather' :
                  settings.fontFamily === 'dyslexic' ? 'font-dyslexic' :
                  'font-sans-ui'
                }\`}
                style={{ 
                  fontSize: \`\${settings.fontSize}px\`, 
                  lineHeight: settings.lineHeight,
                  textAlign: settings.textAlign as any
                }}
              >
                {extractedText.split('\\n\\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-6 whitespace-pre-wrap">
                    {formatBionicText(paragraph)}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 opacity-50 text-center">
                 <Eye className="w-12 h-12 mb-4 opacity-30" />
                 <p>No text could be extracted from this page.</p>
                 <p className="text-sm mt-2">This may be a scanned image without OCR text layer.</p>
                 <button onClick={() => setPdfViewMode('native')} className="mt-4 px-4 py-2 bg-black/10 rounded-md text-sm hover:bg-black/20 transition">Return to Native View</button>
              </div>
            )}
          </div>
        ) : (
          <div 
`;

content = content.replace(`        {!pdfUrl ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            <p>Loading High-Fidelity PDF Engine...</p>
          </div>
        ) : (
          <div `, renderReplacement);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
