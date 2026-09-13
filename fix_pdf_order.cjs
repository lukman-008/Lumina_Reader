const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const highlightsDef = `  const [pdfOutline, setPdfOutline] = useState<any[] | null>(null);
  const [isTOCOpen, setIsTOCOpen] = useState<boolean>(false);
  const [isAnnotationsDrawerOpen, setIsAnnotationsDrawerOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<{ highlight: any, position: {x: number, y: number} } | null>(null);`;

content = content.replace(highlightsDef, '');

const insertionPoint = `  const [pendingHighlightScrollId, setPendingHighlightScrollId] = useState<string | null>(null);`;

content = content.replace(
  insertionPoint,
  highlightsDef + '\n' + insertionPoint
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
