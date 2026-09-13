const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /chapterIndex: pageNumber - 1,/,
  `chapterIndex: selectionOffsets?.pageIndex ? selectionOffsets.pageIndex - 1 : pageNumber - 1,`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
