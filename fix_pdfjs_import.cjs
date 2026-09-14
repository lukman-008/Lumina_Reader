const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// The new syntax for react-pdf 11.0.0 is different
code = code.replace(
  /pdfjs\.GlobalWorkerOptions\.workerSrc[\s\S]*?import\.meta\.url,\s*\)\.toString\(\);/,
  `pdfjs.GlobalWorkerOptions.workerSrc = \`//unpkg.com/pdfjs-dist@\${pdfjs.version}/build/pdf.worker.min.mjs\`;`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
