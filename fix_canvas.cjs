const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Replace all canvasBackground="transparent" with canvasBackground="white" 
// (or just remove it, but white ensures the filter works properly)
content = content.replace(/canvasBackground="transparent"/g, 'canvasBackground="#ffffff"');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
