const fs = require('fs');
const file = 'src/components/ReaderView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add the effects
const effects = `
  // Handle global jump to highlight
  useEffect(() => {
    if (targetHighlightId) {
      setPendingHighlightScrollId(targetHighlightId);
      if (onClearTargetHighlight) onClearTargetHighlight();
    }
  }, [targetHighlightId, onClearTargetHighlight]);

  useEffect(() => {
    if (pendingHighlightScrollId) {
      const targetHighlight = highlights.find(h => h.id === pendingHighlightScrollId);
      
      if (targetHighlight && targetHighlight.chapterIndex === currentChapterIndex) {
        if (settings.layoutMode !== 'scroll') {
          const searchStr = targetHighlight.selectedText.split('\\n')[0].trim();
          const foundPageIdx = pages.findIndex(page => page.some(p => p.includes(searchStr) || targetHighlight.selectedText.includes(p.trim())));
          if (foundPageIdx !== -1 && foundPageIdx !== safePageIndex) {
            setCurrentPageIndex(foundPageIdx);
            return; 
          }
        }
        
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
           }, 500);
           return () => clearTimeout(timer);
        }
      }
    }
  }, [currentChapterIndex, safePageIndex, pendingHighlightScrollId, highlights, pages, settings.layoutMode]);
`;

content = content.replace(
  /  \/\/ Navigation handlers/,
  match => effects + '\n' + match
);

fs.writeFileSync(file, content);
