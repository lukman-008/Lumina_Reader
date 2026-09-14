const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

code = code.replace(
  "file={fileData}",
  "file={pdfUrl}"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
