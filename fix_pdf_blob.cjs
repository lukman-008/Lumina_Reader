const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /const blob = fileData instanceof Blob \? fileData : new Blob\(\[fileData\], \{ type: 'application\/pdf' \}\);/,
  `const blob = fileData instanceof Blob ? fileData : new Blob([fileData], { type: 'application/pdf' });`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
