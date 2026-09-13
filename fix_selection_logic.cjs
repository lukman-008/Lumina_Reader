const fs = require('fs');

const files = ['src/components/ReaderView.tsx', 'src/components/NativePdfReader.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the else block in handleSelection / handleSelectionChange
  content = content.replace(
    /\} else \{\s*setTimeout\(\(\) => \{\s*if \(document\.activeElement\?\.tagName !== 'TEXTAREA' && document\.activeElement\?\.tagName !== 'INPUT'\) \{\s*setSelectionPosition\(null\);\s*\}\s*\}, 50\);\s*\}/,
    `} else {
        // Do not automatically close the popup on selection empty here.
        // We will rely on a document click listener to close it if they click outside.
      }`
  );
  
  // Add a document mousedown/touchstart listener to close it if they click outside
  if (!content.includes('handleClickOutside')) {
    const hookInsertStr = `
  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.fixed.z-50')) {
        // If clicking outside of any popup, clear the selection position
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setSelectionPosition(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
`;
    // Insert it before the return statement of the component
    // We can just find `// Compute theme styles mapping` or `// Handle text selection` and insert it before that.
    content = content.replace(
      /  \/\/ Create highlight|  \/\/ Compute theme styles mapping/,
      `${hookInsertStr}\n$&`
    );
  }
  
  fs.writeFileSync(file, content);
}
