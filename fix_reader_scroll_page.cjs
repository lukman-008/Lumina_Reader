const fs = require('fs');
const file = 'src/components/ReaderView.tsx';
let content = fs.readFileSync(file, 'utf8');

const updatedScrollEffect = `
  useEffect(() => {
    if (pendingHighlightScrollId) {
      const targetHighlight = highlights.find(h => h.id === pendingHighlightScrollId);
      
      if (targetHighlight && targetHighlight.chapterIndex === currentChapterIndex) {
        // If not in scroll mode, we need to ensure we are on the page that contains this highlight
        if (settings.layoutMode !== 'scroll') {
          const foundPageIdx = pages.findIndex(page => page.some(p => p.includes(targetHighlight.selectedText)));
          if (foundPageIdx !== -1 && foundPageIdx !== safePageIndex) {
            setCurrentPageIndex(foundPageIdx);
            return; // Wait for the next render with the correct page
          }
        }
        
        // Scroll to it
        const el = document.getElementById(\`hl-\${pendingHighlightScrollId}\`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const origStyle = el.style.boxShadow;
          el.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.5)';
          setTimeout(() => {
            if (el) el.style.boxShadow = origStyle;
          }, 1500);
          setPendingHighlightScrollId(null);
        } else {
           // Retry after a short delay in case DOM is rendering
           const timer = setTimeout(() => {
             const retryEl = document.getElementById(\`hl-\${pendingHighlightScrollId}\`);
             if (retryEl) {
                retryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const origStyle = retryEl.style.boxShadow;
                retryEl.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.5)';
                setTimeout(() => {
                  if (retryEl) retryEl.style.boxShadow = origStyle;
                }, 1500);
                setPendingHighlightScrollId(null);
             }
           }, 100);
           return () => clearTimeout(timer);
        }
      }
    }
  }, [currentChapterIndex, safePageIndex, pendingHighlightScrollId, highlights, pages, settings.layoutMode]);
`;

content = content.replace(
  /  useEffect\(\(\) => \{\n    if \(pendingHighlightScrollId\) \{[\s\S]*?\}, \[currentChapterIndex, safePageIndex, pendingHighlightScrollId\]\);/,
  updatedScrollEffect.trim()
);

fs.writeFileSync(file, content);
