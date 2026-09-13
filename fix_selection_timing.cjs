const fs = require('fs');

const files = ['src/components/ReaderView.tsx', 'src/components/NativePdfReader.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the handleClickOutside to use a timeout to wait for browser to update selection
  content = content.replace(
    /const handleClickOutside = \(e: MouseEvent \| TouchEvent\) => \{[\s\S]*?\}\s*\}\s*\};\s*document\.addEventListener/m,
    `const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.fixed.z-50')) {
        // Wait for browser to process the click/tap and potentially clear selection
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.toString().trim().length === 0) {
            setSelectionPosition(null);
          }
        }, 100);
      }
    };
    document.addEventListener`
  );
  
  fs.writeFileSync(file, content);
}
