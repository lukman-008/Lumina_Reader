const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (pendingHighlightScrollId) {
      const el = document.querySelector(\`mark[data-highlight-id="\${pendingHighlightScrollId}"]\`) as HTMLElement;
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
          const retryEl = document.querySelector(\`mark[data-highlight-id="\${pendingHighlightScrollId}"]\`) as HTMLElement;
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
  }, [pageNumber, pendingHighlightScrollId]);`;

const newEffect = `  useEffect(() => {
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
      }

      const el = document.querySelector(\`mark[data-highlight-id="\${pendingHighlightScrollId}"]\`) as HTMLElement;
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
          const retryEl = document.querySelector(\`mark[data-highlight-id="\${pendingHighlightScrollId}"]\`) as HTMLElement;
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
  }, [pageNumber, pendingHighlightScrollId, highlights, settings.layoutMode]);`;

content = content.replace(oldEffect, newEffect);

// And update the annotations drawer in NativePdfReader
content = content.replace(
  /onJumpToHighlight=\{\(h\) => \{\n\s*if \(h\.pdfPageIndex !== undefined\) \{\n\s*setPageNumber\(h\.pdfPageIndex\);\n\s*saveProgress\(h\.pdfPageIndex - 1, numPages\);\n\s*\}\n\s*setPendingHighlightScrollId\(h\.id\);\n\s*\}\}/,
  `onJumpToHighlight={(h) => {
          setPendingHighlightScrollId(h.id);
        }}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
