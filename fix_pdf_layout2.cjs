const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /className=\{`flex-1 overflow-y-auto overflow-x-hidden w-full flex justify-center pb-24 \$\{\n\s*settings\.layoutMode === 'scroll' \? 'items-start pt-8' : 'items-center'\n\s*\}\`\}/,
  "className={`flex-1 overflow-y-auto overflow-x-hidden w-full flex justify-center pt-8 pb-24 items-start`}"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
