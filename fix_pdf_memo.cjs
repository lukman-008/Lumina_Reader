const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Wrap customTextRenderer in useCallback
if (!content.includes('useCallback((textItem: any) => {')) {
  // ensure useCallback is imported
  if (!content.includes('useCallback')) {
    content = content.replace(/import React, \{ useState, useEffect, useRef, useMemo \}/, "import React, { useState, useEffect, useRef, useMemo, useCallback }");
  }
  
  content = content.replace(
    /const customTextRenderer = \(textItem: any\) => \{/,
    `const customTextRenderer = useCallback((textItem: any) => {`
  );
  
  content = content.replace(
    /      \} else \{\n        \/\/ Fallback for old highlights without itemIndex\n        if \(str\.includes\(h\.selectedText\)\) \{\n          const style = highlightColors\[h\.color\] \|\| highlightColors\.yellow;\n          result = result\.replace\(\n            h\.selectedText,\n            `<mark data-highlight-id="\$\{h\.id\}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\$\{style\}">\$\{h\.selectedText\}\$\{h\.note \? \`<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba\(245,158,11,0\.25\); color: #d97706; border-radius: 4px; border: 1px solid rgba\(245,158,11,0\.4\);">💬<\/sup>\` : ''\}<\/mark>`\n          \);\n        \}\n      \}\n    \}\n    return result;\n  \};/,
    `      } else {
        // Fallback for old highlights without itemIndex
        if (str.includes(h.selectedText)) {
          const style = highlightColors[h.color] || highlightColors.yellow;
          const titleText = h.note ? \`[Note]: \${h.note.replace(/"/g, '&quot;')}\` : 'Click to view/edit highlight';
          result = result.replace(
            h.selectedText,
            \`<mark data-highlight-id="\${h.id}" title="\${titleText}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\${style}">\${h.selectedText}\${h.note ? \`<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>\` : ''}</mark>\`
          );
        }
      }
    }
    return result;
  }, [highlights]);`
  );
}

// 2. Add title to the other <mark> tags inside customTextRenderer
content = content.replace(
  /const marked = str\.slice\(h\.startOffset, h\.endOffset\);\s*const after = str\.slice\(h\.endOffset\);\s*result = `\$\{before\}<mark data-highlight-id="\$\{h\.id\}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\$\{style\}">\$\{marked\}\$\{h\.note \? [^`]+` : ''\}<\/mark>\$\{after\}`;/,
  `const marked = str.slice(h.startOffset, h.endOffset);
           const after = str.slice(h.endOffset);
           const titleText = h.note ? \`[Note]: \${h.note.replace(/"/g, '&quot;')}\` : 'Click to view/edit highlight';
           result = \`\${before}<mark data-highlight-id="\${h.id}" title="\${titleText}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\${style}">\${marked}\${h.note ? \`<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>\` : ''}</mark>\${after}\`;`
);

content = content.replace(
  /const before = str\.slice\(0, h\.startOffset\);\s*const marked = str\.slice\(h\.startOffset\);\s*result = `\$\{before\}<mark data-highlight-id="\$\{h\.id\}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\$\{style\}">\$\{marked\}\$\{h\.note \? [^`]+` : ''\}<\/mark>`;/,
  `const before = str.slice(0, h.startOffset);
           const marked = str.slice(h.startOffset);
           const titleText = h.note ? \`[Note]: \${h.note.replace(/"/g, '&quot;')}\` : 'Click to view/edit highlight';
           result = \`\${before}<mark data-highlight-id="\${h.id}" title="\${titleText}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\${style}">\${marked}\${h.note ? \`<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>\` : ''}</mark>\`;`
);

content = content.replace(
  /const marked = str\.slice\(0, h\.endOffset\);\s*const after = str\.slice\(h\.endOffset\);\s*result = `<mark data-highlight-id="\$\{h\.id\}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\$\{style\}">\$\{marked\}\$\{h\.note \? [^`]+` : ''\}<\/mark>\$\{after\}`;/,
  `const marked = str.slice(0, h.endOffset);
           const after = str.slice(h.endOffset);
           const titleText = h.note ? \`[Note]: \${h.note.replace(/"/g, '&quot;')}\` : 'Click to view/edit highlight';
           result = \`<mark data-highlight-id="\${h.id}" title="\${titleText}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\${style}">\${marked}\${h.note ? \`<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>\` : ''}</mark>\${after}\`;`
);

content = content.replace(
  /result = `<mark data-highlight-id="\$\{h\.id\}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\$\{style\}">\$\{str\}\$\{h\.note \? [^`]+` : ''\}<\/mark>`;/,
  `const titleText = h.note ? \`[Note]: \${h.note.replace(/"/g, '&quot;')}\` : 'Click to view/edit highlight';
           result = \`<mark data-highlight-id="\${h.id}" title="\${titleText}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="\${style}">\${str}\${h.note ? \`<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>\` : ''}</mark>\`;`
);


// 3. Fix handleClickOutside to also close activeHighlightPopover if we didn't click a mark
content = content.replace(
  /if \(!target\.closest\('\.fixed\.z-50'\)\) \{/,
  `if (!target.closest('.fixed.z-50') && !target.closest('mark.pdf-highlight-mark')) {
        setActiveHighlightPopover(null);`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
