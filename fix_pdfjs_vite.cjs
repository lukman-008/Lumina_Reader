const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// The standard vite configuration for pdfjs-dist 4.0.0+ requires specific worker assignment
code = code.replace(
  "import 'pdfjs-dist/build/pdf.worker.mjs';",
  "pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
