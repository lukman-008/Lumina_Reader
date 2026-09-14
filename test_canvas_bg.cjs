const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Replace all instances of <Page suspense={false} with <Page suspense={false} canvasBackground="transparent"
content = content.replace(/<Page suspense=\{false\}/g, '<Page suspense={false} canvasBackground="transparent"');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
