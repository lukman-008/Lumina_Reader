const fs = require('fs');

const files = ['src/components/SelectionPopup.tsx', 'src/components/HighlightPopover.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add onTouchStart and onTouchEnd to prevent selection clearing on mobile
  if (!content.includes('onTouchStart=')) {
    content = content.replace(
      /onMouseDown=\{\(e\) => \{ if \(e\.target instanceof HTMLTextAreaElement[^}]+\} \}\}/,
      `$&
      onTouchStart={(e) => { if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return; e.stopPropagation(); }}
      onTouchEnd={(e) => e.stopPropagation()}`
    );
    fs.writeFileSync(file, content);
  }
}
