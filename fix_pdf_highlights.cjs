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
    const { str, itemIndex } = textItem;
    // Find highlights that apply to this page (or nearby pages in double/scroll mode)
    // We just check all highlights for simplicity, filtering by current book
    
    let result = str;
    for (const h of highlights) {
      if (str.includes(h.selectedText)) {
        // Wrap the exact matched part in a mark element. 
        // Note: react-pdf uses innerHTML for customTextRenderer string outputs.
        result = result.replace(
          h.selectedText,
          \`<mark style="background-color: rgba(251, 191, 36, 0.4); border-bottom: 2px solid rgba(251, 191, 36, 0.9); color: inherit;">\${h.selectedText}</mark>\`
        );
      } else if (h.selectedText.includes(str) && str.trim().length > 3) {
        // If the span is a sub-part of a larger highlight
        result = \`<mark style="background-color: rgba(251, 191, 36, 0.4); border-bottom: 2px solid rgba(251, 191, 36, 0.9); color: inherit;">\${str}</mark>\`;
      }
    }
    return result;
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
