const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const replacement = `
  // Handle text selection for native PDF highlighting
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Don't show if the selection is outside our container
        if (containerRef.current && !containerRef.current.contains(range.commonAncestorContainer)) { 
          return;
        }
        setSelectedText(selection.toString().trim());
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      } else {
        setTimeout(() => {
          if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
            setSelectionPosition(null);
          }
        }, 50);
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);
`;

content = content.replace(
  /\/\/ Handle text selection for native PDF highlighting[\s\S]*?\}, \[\]\);/,
  replacement.trim()
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
