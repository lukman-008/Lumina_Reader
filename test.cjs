const fs = require('fs');
const content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');
const pType = content.match(/renderParagraphBlock/g);
console.log(pType.length);
