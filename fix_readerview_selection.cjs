const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

const replacement = `
  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setTimeout(() => {
        if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
          setSelectionPosition(null);
        }
      }, 50);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 1) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };
`;

content = content.replace(
  /\/\/ Handle text selection[\s\S]*?  \};\n\n  \/\/ Create highlight/,
  replacement.trim() + '\n\n  // Create highlight'
);

fs.writeFileSync('src/components/ReaderView.tsx', content);
