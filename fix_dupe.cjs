const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const target = "const [pdfViewMode, setPdfViewMode] = useState<'native' | 'reader'>('native');";
const idx1 = content.indexOf(target);
if (idx1 !== -1) {
  const idx2 = content.indexOf(target, idx1 + 1);
  if (idx2 !== -1) {
    const endIdx = content.indexOf('};', content.indexOf('formatBionicText', idx2)) + 2;
    content = content.substring(0, idx2) + content.substring(endIdx);
  }
}

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
