const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Replace everything from line 64 to 88 (or just replace the fragment)
const badFragment = /      \}\n    \};\n\n    extractTextForPage\(pageNumber\);\n    if \(settings\.layoutMode === 'double' && pageNumber \+ 1 <= numPages\) \{\n      extractTextForPage\(pageNumber \+ 1\);\n    \}\n  \}, \[pdfViewMode, pageNumber, fileData, settings\.layoutMode, numPages, extractedPageText\]\);\n\n  \/\/ Bionic reading word transformation helper[\s\S]*?  \};\n/g;

content = content.replace(badFragment, '');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
