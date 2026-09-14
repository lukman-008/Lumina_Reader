const fs = require('fs');
let content = fs.readFileSync('src/components/SearchIndexModal.tsx', 'utf8');

content = content.replace(
  /currentBook\.chapters\.length/g,
  `(currentBook.chapters?.length || 0)`
);

content = content.replace(
  /currentBook\.chapters\.map/g,
  `(currentBook.chapters || []).map`
);

fs.writeFileSync('src/components/SearchIndexModal.tsx', content);
