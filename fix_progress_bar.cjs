const fs = require('fs');
let content = fs.readFileSync('src/components/ReadingProgressBar.tsx', 'utf8');

content = content.replace(/book\.chapters/g, `(book.chapters || [])`);

fs.writeFileSync('src/components/ReadingProgressBar.tsx', content);
