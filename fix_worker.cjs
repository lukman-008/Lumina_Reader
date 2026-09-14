const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');
code = code.replace("import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';\n", "");
code = code.replace("pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;", "pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();");
fs.writeFileSync('src/components/NativePdfReader.tsx', code);
