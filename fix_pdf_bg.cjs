const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /className="max-w-full overflow-hidden flex justify-center"/,
  `className="max-w-full overflow-hidden flex justify-center bg-white shadow-xl"`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
