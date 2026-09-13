const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

content = content.replace(
  /h\.startItemIndex === globalIndex && paragraphText\.includes\(h\.selectedText\)/,
  `(h.startItemIndex === undefined || h.startItemIndex === globalIndex) && paragraphText.includes(h.selectedText)`
);

fs.writeFileSync('src/components/ReaderView.tsx', content);
