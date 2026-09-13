const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /onJumpToHighlight=\{\(h\) => \{\n\s*if \(h\.pdfPageIndex !== undefined\) \{\n\s*setPageNumber\(h\.pdfPageIndex \+ 1\);\n\s*saveProgress\(h\.pdfPageIndex, numPages\);\n\s*\}\n\s*setPendingHighlightScrollId\(h\.id\);\n\s*\}\}/,
  `onJumpToHighlight={(h) => {
          setPendingHighlightScrollId(h.id);
        }}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
