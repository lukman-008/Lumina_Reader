const fs = require('fs');
let content = fs.readFileSync('src/components/FileImporterModal.tsx', 'utf8');

content = content.replace(
  /item\.parsedBook\.chapters\.length/g,
  `(item.parsedBook.chapters?.length || 0)`
);

fs.writeFileSync('src/components/FileImporterModal.tsx', content);
