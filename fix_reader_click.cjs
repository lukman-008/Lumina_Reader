const fs = require('fs');

let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

content = content.replace(
  /if \(!target\.closest\('\.fixed\.z-50'\)\) \{/,
  `if (!target.closest('.fixed.z-50')) {
        if (!target.closest('mark')) {
          setActiveHighlightPopover(null);
        }`
);

fs.writeFileSync('src/components/ReaderView.tsx', content);
