const fs = require('fs');

let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

// 1. Fix main container padding
code = code.replace(
  'p-6 sm:p-8 pb-36 sm:pb-44',
  'p-4 sm:p-8 pb-36 sm:pb-44'
);

// 2. Fix the layout toolbar flex container
code = code.replace(
  '<div className="flex items-center justify-between text-xs text-slate-400 pt-1">',
  '<div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">'
);

// 3. Fix the Shelves & Collections Bar scrollbar so it's obvious on mobile, and let it take up full space by letting items shrink or just letting user scroll with a visible scrollbar.
// Wait, `overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80 pb-3` is weird: it has pb-1 and pb-3?
code = code.replace(
  'gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80 pb-3',
  'gap-1.5 overflow-x-auto flex-nowrap scrollbar-thin scrollbar-thumb-slate-700/50 border-b border-slate-800/80 pb-3'
);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('Patched LibraryView layout issues');
