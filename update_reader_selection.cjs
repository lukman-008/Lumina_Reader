const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

// 1. Update useState
content = content.replace(
  /const \[selectionOffsets, setSelectionOffsets\] = useState<\{startOffset: number, endOffset: number\} \| null>\(null\);/,
  `const [selectionOffsets, setSelectionOffsets] = useState<{startOffset: number, endOffset: number, startItemIndex: number} | null>(null);`
);

// 2. Update handleSelectionEnd
const oldSelectionLogic = `          const pElem = range.commonAncestorContainer.nodeType === 3 
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
          }`;

const newSelectionLogic = `          const pElem = range.commonAncestorContainer.nodeType === 3 
             ? range.commonAncestorContainer.parentElement?.closest('[data-paragraph-index]')
             : (range.commonAncestorContainer as HTMLElement).closest('[data-paragraph-index]');
                
          if (pElem) {
            const pIndex = parseInt(pElem.getAttribute('data-paragraph-index') || '-1', 10);
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(pElem);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            sOffset = preSelectionRange.toString().length;
            eOffset = sOffset + selection.toString().length;
            setSelectionOffsets({ startOffset: sOffset, endOffset: eOffset, startItemIndex: pIndex });
          } else {
            setSelectionOffsets(null);
          }`;

content = content.replace(oldSelectionLogic, newSelectionLogic);

fs.writeFileSync('src/components/ReaderView.tsx', content);
