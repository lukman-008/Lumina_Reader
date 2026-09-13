const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/gemini-2\.5-flash/g, 'gemini-3.6-flash');
fs.writeFileSync('server.ts', content);
