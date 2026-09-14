const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(/bookData\?.fileData/g, 'bookData?.rawFile');
content = content.replace(/bookData\.fileData/g, 'bookData.rawFile');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
