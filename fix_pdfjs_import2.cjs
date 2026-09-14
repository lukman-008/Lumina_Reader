const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

code = code.replace("import 'react-pdf/dist/esm/Page/AnnotationLayer.css';", "");
code = code.replace("import 'react-pdf/dist/esm/Page/TextLayer.css';", "");

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
