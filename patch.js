const fs = require('fs');
const content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf-8');
const newContent = content.replace(
  "import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';\n\n// Set up standard worker config\npdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;",
  `// Set up standard worker config\npdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();`
);
fs.writeFileSync('src/components/NativePdfReader.tsx', newContent);
