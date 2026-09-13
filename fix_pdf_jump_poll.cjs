const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const oldEffect = `      const el = document.querySelector(\`mark[data-highlight-id="\${pendingHighlightScrollId}"]\`) as HTMLElement;
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
      }`;

const newEffect = `      let attempts = 0;
      const maxAttempts = 20; // 4 seconds total
      
      const tryScroll = () => {
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
          attempts++;
          if (attempts < maxAttempts) {
            timer = setTimeout(tryScroll, 250);
          } else {
            // Give up after 5 seconds
            setPendingHighlightScrollId(null);
          }
        }
      };
      
      let timer = setTimeout(tryScroll, 100);
      return () => clearTimeout(timer);`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/NativePdfReader.tsx', content);
