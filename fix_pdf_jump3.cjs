const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (pendingHighlightScrollId) {
      const targetHighlight = highlights.find(h => h.id === pendingHighlightScrollId);
      
      if (targetHighlight && targetHighlight.pdfPageIndex !== undefined) {
        // Only jump if it's not currently visible
        const currentPages = settings.layoutMode === 'double' ? [pageNumber, pageNumber + 1] : [pageNumber];
        if (!currentPages.includes(targetHighlight.pdfPageIndex)) {
          // It's not visible, we need to change page!
          setPageNumber(targetHighlight.pdfPageIndex);
          // Don't clear pendingHighlightScrollId yet, let it render and find it in the DOM on next effect pass
          return; 
        }
      }`;

const newEffect = `  useEffect(() => {
    if (pendingHighlightScrollId) {
      const targetHighlight = highlights.find(h => h.id === pendingHighlightScrollId);
      
      if (targetHighlight) {
        const targetPage = targetHighlight.pdfPageIndex !== undefined ? targetHighlight.pdfPageIndex : targetHighlight.chapterIndex + 1;
        
        // Only jump if it's not currently visible
        const currentPages = settings.layoutMode === 'double' ? [pageNumber, pageNumber + 1] : [pageNumber];
        if (!currentPages.includes(targetPage)) {
          // It's not visible, we need to change page!
          setPageNumber(targetPage);
          // Don't clear pendingHighlightScrollId yet, let it render and find it in the DOM on next effect pass
          return; 
        }
      }`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/NativePdfReader.tsx', content);
