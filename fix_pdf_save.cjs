const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /selectedText,\s*color: color as any,/,
  `selectedText,
      startItemIndex: selectionOffsets?.startItemIndex,
      startOffset: selectionOffsets?.startOffset,
      endItemIndex: selectionOffsets?.endItemIndex,
      endOffset: selectionOffsets?.endOffset,
      pdfPageIndex: selectionOffsets?.pageIndex,
      color: color as any,`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
