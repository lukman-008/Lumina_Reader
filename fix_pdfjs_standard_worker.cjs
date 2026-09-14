const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

code = code.replace(
  "import { Document, Page, pdfjs } from 'react-pdf';",
  "import { Document, Page, pdfjs } from 'react-pdf';"
);
// In Vite environments, importing the worker directly is the recommended way to avoid URL fetching issues:
code = code.replace(
  /pdfjs\.GlobalWorkerOptions\.workerSrc[\s\S]*?;/,
  "import 'pdfjs-dist/build/pdf.worker.mjs';"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
