const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

// just in case, we could default it where used, but it's easier to just do it at the top of the component:
// const safeChapters = book.chapters || [];
// But replacing all `book.chapters` with `(book.chapters || [])` works too.

content = content.replace(/book\.chapters/g, `(book.chapters || [])`);

fs.writeFileSync('src/components/ReaderView.tsx', content);
