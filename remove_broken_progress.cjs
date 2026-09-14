const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Remove import
content = content.replace(/import \{ ReadingProgressBar \} from '\.\/ReadingProgressBar';\n/, '');

// 2. Remove the JSX
const regex = /\{\/\* Universal Reading Progress Bar at the bottom \*\/\}[\s\S]*?<\/div>\n      \)\}/;
content = content.replace(regex, '');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
