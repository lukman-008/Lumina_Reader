const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Remove the function definition
content = content.replace(/  const makeCustomTextRenderer = \(pageIdx: number\) => {\n    return \(textItem: any\) => {\n      return textItem\.str;\n    };\n  };\n/g, '');

// Remove all usages
content = content.replace(/ customTextRenderer={makeCustomTextRenderer\([^)]+\)}/g, '');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
