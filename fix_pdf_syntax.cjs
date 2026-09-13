const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /return `<span data-pdf-item-index="\$\{itemIndex\}">\$\{result\}<\/span>`;\n  \};/,
  `return \`<span data-pdf-item-index="\${itemIndex}">\${result}</span>\`;\n  }, [highlights]);`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
