const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// For Array.from (scroll mode)
content = content.replace(
  /<Page suspense=\{false\} customTextRenderer=\{makeCustomTextRenderer\(pageNumber\)\}\n\s*pageNumber=\{index \+ 1\}/g,
  '<Page suspense={false} customTextRenderer={makeCustomTextRenderer(index + 1)}\n                        pageNumber={index + 1}'
);

// For double mode pageNumber + 1
content = content.replace(
  /<Page suspense=\{false\} customTextRenderer=\{makeCustomTextRenderer\(pageNumber\)\}\n\s*pageNumber=\{pageNumber \+ 1\}/g,
  '<Page suspense={false} customTextRenderer={makeCustomTextRenderer(pageNumber + 1)}\n                        pageNumber={pageNumber + 1}'
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
