const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// The crash when going to "reader" mode might be in `extractCurrentPages`.
// When we extract text, we await `page.getTextContent()`. 
// Wait! `pdfDoc` might be stale or destroyed if we unmount Document. 
// But since the pdf is a Blob URL, the Document unmounting might destroy the pdfDoc entirely internally.
// Let's make sure we catch errors in extractCurrentPages and set a fallback text instead of crashing.

code = code.replace(
  "setExtractedText(\"Failed to extract text from this page. This PDF might be an image without an OCR layer.\");",
  "console.error('Extraction error:', e); setExtractedText(\"Failed to extract text from this page. This PDF might be an image without an OCR layer or the document was unmounted.\");"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
