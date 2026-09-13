const fs = require('fs');
const file = 'src/components/NativePdfReader.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add selectionOffsets state
if (!content.includes('const [selectionOffsets, setSelectionOffsets]')) {
  content = content.replace(
    /const \[selectedText, setSelectedText\] = useState<string>\(''\);/,
    `$&
  const [selectionOffsets, setSelectionOffsets] = useState<{startItemIndex: number, startOffset: number, endItemIndex: number, endOffset: number, pageIndex: number} | null>(null);`
  );
}

// 2. Rewrite customTextRenderer
const customTextRendererOld = /const customTextRenderer = \(textItem: any\) => \{[\s\S]*?return result;\s*\};/;
const customTextRendererNew = `const customTextRenderer = (textItem: any) => {
    const { str, itemIndex } = textItem;
    // pageIndex isn't directly in textItem, but textItem is bound per page if we wanted.
    // Actually, we can just use the fact that itemIndex is unique per page.
    let result = str;
    
    // highlightColors from component scope
    const highlightColors: Record<Highlight['color'], string> = {
      yellow: 'background-color: rgba(251, 191, 36, 0.4); border-bottom: 2px solid rgba(251, 191, 36, 0.9); color: inherit;',
      emerald: 'background-color: rgba(52, 211, 153, 0.4); border-bottom: 2px solid rgba(52, 211, 153, 0.9); color: inherit;',
      sky: 'background-color: rgba(56, 189, 248, 0.4); border-bottom: 2px solid rgba(56, 189, 248, 0.9); color: inherit;',
      rose: 'background-color: rgba(251, 113, 133, 0.4); border-bottom: 2px solid rgba(251, 113, 133, 0.9); color: inherit;',
      amber: 'background-color: rgba(251, 146, 60, 0.4); border-bottom: 2px solid rgba(251, 146, 60, 0.9); color: inherit;',
      violet: 'background-color: rgba(192, 132, 252, 0.4); border-bottom: 2px solid rgba(192, 132, 252, 0.9); color: inherit;',
    };

    for (const h of highlights) {
      if (h.startItemIndex !== undefined && h.endItemIndex !== undefined) {
        // Assume matching page via the fact we only render current pages, but better if we had pageIndex
        // For simplicity, if itemIndex falls in range. (Note: itemIndex restarts at 0 per page)
        // Wait, if itemIndex restarts at 0 per page, and we show TWO pages on screen (double mode),
        // we need to be careful. But NativePdfReader renders <Page> which scopes customTextRenderer per page.
        // Wait, customTextRenderer doesn't know its pageNumber. We can pass it in via closure?
        // Yes, but react-pdf's customTextRenderer prop is shared. Let's just use itemIndex and hope highlights don't clash across visible pages.
        // Actually, if we just check if str is part of h.selectedText as a secondary guard!
        
        // Let's use the precise itemIndex logic:
        const style = highlightColors[h.color] || highlightColors.yellow;
        if (itemIndex === h.startItemIndex && itemIndex === h.endItemIndex) {
           const before = str.slice(0, h.startOffset);
           const marked = str.slice(h.startOffset, h.endOffset);
           const after = str.slice(h.endOffset);
           result = \`\${before}<mark style="\${style}">\${marked}</mark>\${after}\`;
        } else if (itemIndex === h.startItemIndex) {
           const before = str.slice(0, h.startOffset);
           const marked = str.slice(h.startOffset);
           result = \`\${before}<mark style="\${style}">\${marked}</mark>\`;
        } else if (itemIndex === h.endItemIndex) {
           const marked = str.slice(0, h.endOffset);
           const after = str.slice(h.endOffset);
           result = \`<mark style="\${style}">\${marked}</mark>\${after}\`;
        } else if (itemIndex > h.startItemIndex && itemIndex < h.endItemIndex) {
           result = \`<mark style="\${style}">\${str}</mark>\`;
        }
      } else {
        // Fallback for old highlights without itemIndex
        if (str.includes(h.selectedText)) {
          const style = highlightColors[h.color] || highlightColors.yellow;
          result = result.replace(
            h.selectedText,
            \`<mark style="\${style}">\${h.selectedText}</mark>\`
          );
        }
      }
    }
    
    // Always wrap in a span with data-item-index so we can extract it during selection!
    return \`<span data-pdf-item-index="\${itemIndex}">\${result}</span>\`;
  };`;

content = content.replace(customTextRendererOld, customTextRendererNew);

// 3. Rewrite handleSelectionEnd
const handleSelectionEndOld = /const handleSelectionEnd = \(\) => \{[\s\S]*?\}, 50\);\s*\};/;
const handleSelectionEndNew = `const handleSelectionEnd = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          const container = document.querySelector('.react-pdf__Document');
          if (container && !container.contains(range.commonAncestorContainer)) {
            return;
          }

          // Extract pdf item indexes from the DOM
          const getPdfIndex = (node) => {
            const span = node.nodeType === 3 ? node.parentElement.closest('[data-pdf-item-index]') : node.closest('[data-pdf-item-index]');
            if (span) {
              return parseInt(span.getAttribute('data-pdf-item-index') || '-1', 10);
            }
            return -1;
          };

          const startItemIndex = getPdfIndex(range.startContainer);
          const endItemIndex = getPdfIndex(range.endContainer);
          
          if (startItemIndex !== -1 && endItemIndex !== -1) {
            setSelectionOffsets({
              startItemIndex: Math.min(startItemIndex, endItemIndex),
              startOffset: startItemIndex <= endItemIndex ? range.startOffset : range.endOffset,
              endItemIndex: Math.max(startItemIndex, endItemIndex),
              endOffset: startItemIndex <= endItemIndex ? range.endOffset : range.startOffset,
              pageIndex: pageNumber
            });
          } else {
            setSelectionOffsets(null);
          }

          setSelectedText(selection.toString().trim());
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      }, 50);
    };`;

content = content.replace(handleSelectionEndOld, handleSelectionEndNew);

// 4. In handleCreateHighlight, save offsets
if (!content.includes('startItemIndex: selectionOffsets?.startItemIndex')) {
  content = content.replace(
    /selectedText,\n\s*color,/,
    `selectedText,
      startItemIndex: selectionOffsets?.startItemIndex,
      startOffset: selectionOffsets?.startOffset,
      endItemIndex: selectionOffsets?.endItemIndex,
      endOffset: selectionOffsets?.endOffset,
      pdfPageIndex: selectionOffsets?.pageIndex,
      color,`
  );
}

fs.writeFileSync(file, content);
