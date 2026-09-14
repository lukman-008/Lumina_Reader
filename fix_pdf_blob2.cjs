const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /const blob = fileData instanceof Blob \? fileData : new Blob\(\[fileData\], \{ type: 'application\/pdf' \}\);/,
  `// In case fileData is an ArrayBuffer (which it usually is from db), make a Blob
    let blob;
    if (fileData instanceof Blob) {
      blob = fileData;
    } else {
      blob = new Blob([fileData], { type: 'application/pdf' });
    }`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
