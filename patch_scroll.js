const fs = require('fs');
const content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf-8');

const oldScroll = `        onScroll={() => {
          if (activeHighlightPopover) setActiveHighlightPopover(null);
          if (selectionPosition) setSelectionPosition(null);
        }}`;

const newScroll = `        onScroll={(e) => {
          if (activeHighlightPopover) setActiveHighlightPopover(null);
          if (selectionPosition) setSelectionPosition(null);
          if (settings.layoutMode === 'scroll') {
            const container = e.currentTarget;
            const pageElements = container.querySelectorAll('[data-page-number]');
            let bestPage = pageNumber;
            let minDistance = Infinity;
            const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;
            
            pageElements.forEach(el => {
              const rect = el.getBoundingClientRect();
              const center = rect.top + rect.height / 2;
              const dist = Math.abs(center - containerCenter);
              if (dist < minDistance) {
                minDistance = dist;
                bestPage = Number(el.getAttribute('data-page-number'));
              }
            });
            if (bestPage && bestPage !== pageNumber) {
              setPageNumber(bestPage);
            }
          }
        }}`;

fs.writeFileSync('src/components/NativePdfReader.tsx', content.replace(oldScroll, newScroll));
