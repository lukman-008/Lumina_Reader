const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Just remove canvasBackground="#ffffff" completely
content = content.replace(/ canvasBackground="#ffffff"/g, '');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
