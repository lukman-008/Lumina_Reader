const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');
content = content.replace(
  /    return `<span data-pdf-item-index="\$\{itemIndex\}">` \+ result \+ `<\/span>`;\n  \}, \[highlights\]\);/g,
  `    return \`<span data-pdf-item-index="\${itemIndex}">\${result}</span>\`;\n    };\n  }, [highlights]);`
);
// Or wait, string match exactly what's there
content = content.replace(
  /    return `<span data-pdf-item-index="\$\{itemIndex\}">\$\{result\}<\/span>`;\n  \}, \[highlights\]\);/,
  `    return \`<span data-pdf-item-index="\${itemIndex}">\${result}</span>\`;\n    };\n  }, [highlights]);`
);
fs.writeFileSync('src/components/NativePdfReader.tsx', content);
