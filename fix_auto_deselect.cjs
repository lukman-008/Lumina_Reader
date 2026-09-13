const fs = require('fs');

const files = ['src/components/ReaderView.tsx', 'src/components/NativePdfReader.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the selectionchange listener with mouseup/touchend
  const replacement = `
  // Listen for text selection completion (mouseup/touchend) instead of selectionchange 
  // to avoid re-rendering the DOM while the user is actively dragging, which destroys the selection.
  useEffect(() => {
    const handleSelectionEnd = () => {
      // Small timeout to allow the browser to settle the selection
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          const container = document.querySelector('.reading-content') || document.querySelector('.react-pdf__Document');
          if (container && !container.contains(range.commonAncestorContainer)) {
            return;
          }

          setSelectedText(selection.toString().trim());
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      }, 50);
    };
    
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);
    document.addEventListener('keyup', (e) => {
      if (e.shiftKey && e.key.includes('Arrow')) {
        handleSelectionEnd();
      }
    });

    return () => {
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchend', handleSelectionEnd);
    };
  }, []);
`;

  // Find where the old selection logic starts and ends
  // In ReaderView it's "// Listen for text selection"
  // In NativePdfReader it's "// Handle text selection for native PDF highlighting"
  if (file.includes('ReaderView.tsx')) {
    content = content.replace(
      /\/\/ Listen for text selection[\s\S]*?\}, \[\]\);/,
      replacement.trim()
    );
  } else {
    content = content.replace(
      /\/\/ Handle text selection for native PDF highlighting[\s\S]*?\}, \[\]\);/,
      replacement.trim()
    );
  }
  
  fs.writeFileSync(file, content);
}
