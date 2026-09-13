const fs = require('fs');

const typeFile = 'src/types/index.ts';
let types = fs.readFileSync(typeFile, 'utf8');

if (!types.includes('startOffset?: number')) {
  types = types.replace(
    /selectedText: string;/,
    `selectedText: string;\n  startOffset?: number;\n  endOffset?: number;`
  );
  fs.writeFileSync(typeFile, types);
}
