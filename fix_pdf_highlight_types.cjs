const fs = require('fs');
const typeFile = 'src/types/index.ts';
let types = fs.readFileSync(typeFile, 'utf8');

if (!types.includes('startItemIndex?: number')) {
  types = types.replace(
    /endOffset\?: number;/,
    `endOffset?: number;\n  startItemIndex?: number;\n  endItemIndex?: number;\n  pdfPageIndex?: number;`
  );
  fs.writeFileSync(typeFile, types);
}
