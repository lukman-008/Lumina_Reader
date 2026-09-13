const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

const replacement = `
  // Listen for text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Ensure the selection is within the reader content, not UI elements
        const container = document.querySelector('.reading-content');
        if (container && !container.contains(range.commonAncestorContainer)) {
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
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);
`;

content = content.replace(
  /\/\/ Handle text selection[\s\S]*?  \};\n\n  \/\/ Create highlight/,
  replacement.trim() + '\n\n  // Create highlight'
);

// Remove onMouseUp={handleMouseUp} from the return statement
content = content.replace(/onMouseUp=\{handleMouseUp\}/g, '');

fs.writeFileSync('src/components/ReaderView.tsx', content);
