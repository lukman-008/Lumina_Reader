const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

content = content.replace(
  /startOffset: selectionOffsets\?\.startOffset,\n\s*endOffset: selectionOffsets\?\.endOffset,/,
  `startItemIndex: selectionOffsets?.startItemIndex,\n      startOffset: selectionOffsets?.startOffset,\n      endOffset: selectionOffsets?.endOffset,`
);

fs.writeFileSync('src/components/ReaderView.tsx', content);
