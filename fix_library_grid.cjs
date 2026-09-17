const fs = require('fs');

let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

code = code.replace(
  /<div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl flex items-center justify-between">/g,
  '<div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl flex flex-wrap gap-4 items-center justify-between">'
);

code = code.replace(
  /shadow-xl flex items-center justify-between cursor-pointer transition group/g,
  'shadow-xl flex flex-wrap gap-4 items-center justify-between cursor-pointer transition group'
);

code = code.replace(
  /group flex items-center justify-between p-3 rounded-2xl/g,
  'group flex flex-wrap gap-2 items-center justify-between p-3 rounded-2xl'
);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('Patched library grids');
