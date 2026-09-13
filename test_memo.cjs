const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Replace customTextRenderer with makeCustomTextRenderer
content = content.replace(
  /const customTextRenderer = useCallback\(\(textItem: any\) => \{/,
  `const makeCustomTextRenderer = useCallback((renderPageIndex: number) => (textItem: any) => {`
);

// Close the closure
content = content.replace(
  /  \}, \[highlights\]\);/,
  `  }, [highlights]);`
);

fs.writeFileSync('test.txt', 'ok');
