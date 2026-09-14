const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const optionsString = `
  const pdfOptions = useMemo(() => ({
    cMapUrl: \`https://unpkg.com/pdfjs-dist@\${pdfjs.version}/cmaps/\`,
    cMapPacked: true,
    standardFontDataUrl: \`https://unpkg.com/pdfjs-dist@\${pdfjs.version}/standard_fonts/\`,
  }), []);
`;

content = content.replace(
  /const themeStyle = useMemo/,
  optionsString + '\n  const themeStyle = useMemo'
);

content = content.replace(
  /<Document suspense=\{false\}/,
  `<Document suspense={false} options={pdfOptions}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
