const fs = require('fs');

const file = 'src/components/ReaderView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for selection offsets
if (!content.includes('const [selectionOffsets, setSelectionOffsets]')) {
  content = content.replace(
    /const \[selectionPosition, setSelectionPosition\] = useState[\s\S]*?;/,
    `$&
  const [selectionOffsets, setSelectionOffsets] = useState<{startOffset: number, endOffset: number} | null>(null);`
  );
}

// 2. In handleSelectionEnd, compute offsets
const handleSelectionEndRegex = /setSelectedText\(selection\.toString\(\)\.trim\(\)\);/;
if (content.includes('setSelectedText(selection.toString().trim());')) {
  content = content.replace(
    handleSelectionEndRegex,
    `
          let sOffset = -1;
          let eOffset = -1;
          const pElem = range.commonAncestorContainer.nodeType === 3 
             ? range.commonAncestorContainer.parentElement?.closest('p')
             : (range.commonAncestorContainer as HTMLElement).closest('p');
             
          if (pElem) {
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(pElem);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            sOffset = preSelectionRange.toString().length;
            eOffset = sOffset + selection.toString().length;
            setSelectionOffsets({ startOffset: sOffset, endOffset: eOffset });
          } else {
            setSelectionOffsets(null);
          }
          
          setSelectedText(selection.toString().trim());`
  );
}

// 3. In handleCreateHighlight, save offsets
if (!content.includes('startOffset: selectionOffsets?.startOffset')) {
  content = content.replace(
    /selectedText,\n\s*color,/,
    `selectedText,
      startOffset: selectionOffsets?.startOffset,
      endOffset: selectionOffsets?.endOffset,
      color,`
  );
}

// 4. In renderParagraphContent, sort by startOffset and use it to find the index
// The old way:
// const sorted = [...chapterHighlights].sort((a, b) => paragraphText.indexOf(a.selectedText) - paragraphText.indexOf(b.selectedText));
// The new way:
// We use startOffset if it exists, otherwise indexOf.
const renderParaRegex = /const sorted = \[\.\.\.chapterHighlights\]\.sort\(\s*\(a, b\) => paragraphText\.indexOf\(a\.selectedText\) - paragraphText\.indexOf\(b\.selectedText\)\s*\);/;

if (content.match(renderParaRegex)) {
  content = content.replace(
    renderParaRegex,
    `const sorted = [...chapterHighlights].sort((a, b) => {
      const idxA = a.startOffset !== undefined ? a.startOffset : paragraphText.indexOf(a.selectedText);
      const idxB = b.startOffset !== undefined ? b.startOffset : paragraphText.indexOf(b.selectedText);
      return idxA - idxB;
    });`
  );
}

// Replace the indexOf in the loop:
// const idx = paragraphText.indexOf(h.selectedText, lastIndex);
if (content.includes('const idx = paragraphText.indexOf(h.selectedText, lastIndex);')) {
  content = content.replace(
    /const idx = paragraphText\.indexOf\(h\.selectedText, lastIndex\);/,
    `let idx = h.startOffset !== undefined ? h.startOffset : paragraphText.indexOf(h.selectedText, lastIndex);
      // Fallback if offset doesn't match string (e.g. text changed or whitespace issues)
      if (h.startOffset !== undefined && paragraphText.substring(h.startOffset, h.endOffset).trim() !== h.selectedText.trim()) {
        idx = paragraphText.indexOf(h.selectedText, lastIndex);
      }`
  );
}

fs.writeFileSync(file, content);
