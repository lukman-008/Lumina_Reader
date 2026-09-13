const fs = require('fs');
const file = 'src/components/NativePdfReader.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /  const \[pendingHighlightScrollId, setPendingHighlightScrollId\] = useState<string \| null>\(null\);\n/,
  ''
);

content = content.replace(
  /  const \[selectionOffsets, setSelectionOffsets\] = useState<\{.*?\} \| null>\(null\);/,
  match => match + '\n  const [pendingHighlightScrollId, setPendingHighlightScrollId] = useState<string | null>(null);\n\n  useEffect(() => {\n    if (targetHighlightId) {\n      setPendingHighlightScrollId(targetHighlightId);\n      if (onClearTargetHighlight) onClearTargetHighlight();\n    }\n  }, [targetHighlightId, onClearTargetHighlight]);'
);

fs.writeFileSync(file, content);
