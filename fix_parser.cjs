const fs = require('fs');

let content = fs.readFileSync('src/services/bookParser.ts', 'utf8');

content = content.replace(
  /const textDecoder = new TextDecoder\('utf-8', \{ fatal: false \}\);\n\s*const rawString = textDecoder\.decode\(arrayBuffer\);/,
  `const textDecoder = new TextDecoder('utf-8', { fatal: false });
  // Limit to 5MB for parsing unknown text to prevent freezing main thread
  const rawString = textDecoder.decode(arrayBuffer.byteLength > 5000000 && extension !== 'txt' && extension !== 'md' ? arrayBuffer.slice(0, 5000000) : arrayBuffer);`
);

fs.writeFileSync('src/services/bookParser.ts', content);
