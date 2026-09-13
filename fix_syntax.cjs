const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

content = content.replace(
  /const \[selectionPosition, setSelectionPosition\] = useState<\{ x: number;\n\s*const \[selectionOffsets[\s\S]*?\} \| null>\(null\);/,
  `const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectionOffsets, setSelectionOffsets] = useState<{startOffset: number, endOffset: number} | null>(null);`
);

fs.writeFileSync('src/components/ReaderView.tsx', content);
