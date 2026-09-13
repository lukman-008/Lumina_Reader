const fs = require('fs');
const file = 'src/components/NativePdfReader.tsx';
let content = fs.readFileSync(file, 'utf8');

const scrollEffect = `
  useEffect(() => {
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
  }, [pageNumber, pendingHighlightScrollId]);
`;

content = content.replace(
  /  \/\/ TOC States/,
  match => scrollEffect + '\n' + match
);

fs.writeFileSync(file, content);
