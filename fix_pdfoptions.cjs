const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

code = code.replace(
  "standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,",
  "standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,\n    wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
