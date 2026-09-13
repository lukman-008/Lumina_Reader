const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');
content = content.replace(
  /import \{ Book, ReaderSettings \} from '\.\.\/types';/,
  `import { Book, ReaderSettings, Highlight } from '../types';`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
