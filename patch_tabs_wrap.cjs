const fs = require('fs');

let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

code = code.replace(
  'gap-1.5 overflow-x-auto flex-nowrap scrollbar-thin scrollbar-thumb-slate-700/50 border-b border-slate-800/80 pb-3',
  'flex-wrap gap-2 border-b border-slate-800/80 pb-3'
);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('Patched tabs to wrap');
