const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

if (!content.includes('const [highlights, setHighlights]')) {
  // Add state for highlights
  content = content.replace(
    'const [pdfInstance, setPdfInstance] = useState<any>(null);',
    'const [pdfInstance, setPdfInstance] = useState<any>(null);\n  const [highlights, setHighlights] = useState<any[]>([]);'
  );

  // Add loadHighlights
  content = content.replace(
    '// Handle text selection for native PDF highlighting',
    `useEffect(() => {
    const loadHighlights = async () => {
      const all = await db.highlights.where('bookId').equals(book.id).toArray();
      setHighlights(all);
    };
    loadHighlights();
  }, [book.id]);

  const customTextRenderer = (textItem: any) => {
    const { str } = textItem;
    // Find highlights that apply to this page
    const pageHighlights = highlights.filter(h => h.chapterIndex === pageNumber - 1);
    
    // Very basic highlighting: if the textItem string contains the selected text
    for (const h of pageHighlights) {
      if (str.includes(h.selectedText) || h.selectedText.includes(str)) {
        return \`<mark class="bg-amber-400/40 border-b-2 border-amber-400/90 text-inherit">\${str}</mark>\`;
      }
    }
    return str;
  };

  // Handle text selection for native PDF highlighting`
  );

  // Add customTextRenderer to <Page>
  content = content.replace(/<Page suspense=\{false\}/g, '<Page suspense={false} customTextRenderer={customTextRenderer}');
  
  // Reload highlights after creation
  content = content.replace(
    'window.getSelection()?.removeAllRanges();',
    'window.getSelection()?.removeAllRanges();\n    const all = await db.highlights.where(\'bookId\').equals(book.id).toArray();\n    setHighlights(all);'
  );

  fs.writeFileSync('src/components/NativePdfReader.tsx', content);
}
