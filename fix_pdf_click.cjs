const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

if (!content.includes('data-highlight-id=')) {
  // First, in customTextRenderer, inject data-highlight-id so we can find it
  content = content.replace(
    /<mark style="\$\{style\}">\$\{marked\}<\/mark>/g,
    '<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${marked}</mark>'
  );
  content = content.replace(
    /<mark style="\$\{style\}">\$\{str\}<\/mark>/g,
    '<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${str}</mark>'
  );
  content = content.replace(
    /<mark style="\$\{style\}">\$\{h.selectedText\}<\/mark>/g,
    '<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${h.selectedText}</mark>'
  );
  
  // Also add the note indicator
  const addNoteIndicator = (str) => {
    // We can't use React elements here, so we append raw HTML
    return str.replace('</mark>', '${h.note ? `<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #f59e0b; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>` : \'\'}</mark>');
  };
  content = content.replace(/<mark([^>]*)>([^<]*)<\/mark>/g, '<mark$1>$2${h.note ? `<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>` : \'\'}</mark>');
}

if (!content.includes('handleMarkClick')) {
  // Add a global click listener for the pdf marks
  const listener = `
  // Listen for clicks on PDF highlight marks
  useEffect(() => {
    const handleMarkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark.pdf-highlight-mark');
      if (mark) {
        const id = mark.getAttribute('data-highlight-id');
        const h = highlights.find(x => x.id === id);
        if (h) {
          const rect = mark.getBoundingClientRect();
          setActiveHighlightPopover({
            highlight: h,
            position: { x: rect.left + rect.width / 2, y: rect.top - 10 }
          });
        }
      }
    };
    document.addEventListener('click', handleMarkClick);
    return () => document.removeEventListener('click', handleMarkClick);
  }, [highlights]);
`;
  
  content = content.replace(
    /  \/\/ Close popup if clicking outside/,
    `${listener}\n$&`
  );
}

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
