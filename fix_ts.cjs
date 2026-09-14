const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');
content = content.replace('if (node) observer.observe(node);', 'if (node) observer.observe(node as Element);');
fs.writeFileSync('src/components/NativePdfReader.tsx', content);
