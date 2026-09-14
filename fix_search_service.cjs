const fs = require('fs');
let content = fs.readFileSync('src/services/searchIndexService.ts', 'utf8');

content = content.replace(
  /book\.chapters\.forEach/g,
  `(book.chapters || []).forEach`
);

fs.writeFileSync('src/services/searchIndexService.ts', content);
