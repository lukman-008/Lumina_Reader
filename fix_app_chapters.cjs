const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /Math\.max\(0, targetBook\.chapters\.length - 1\)/g,
  `Math.max(0, (targetBook.chapters?.length || 1) - 1)`
);

content = content.replace(
  /Math\.max\(1, targetBook\.chapters\.length\)/g,
  `Math.max(1, targetBook.chapters?.length || 1)`
);

fs.writeFileSync('src/App.tsx', content);
