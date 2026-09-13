const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /const startItemIndex = getPdfIndex\(range\.startContainer\);\s*const endItemIndex = getPdfIndex\(range\.endContainer\);\s*if \(startItemIndex !== -1 && endItemIndex !== -1\) \{\s*setSelectionOffsets\(\{\s*startItemIndex: Math\.min\(startItemIndex, endItemIndex\),\s*startOffset: startItemIndex <= endItemIndex \? range\.startOffset : range\.endOffset,\s*endItemIndex: Math\.max\(startItemIndex, endItemIndex\),\s*endOffset: startItemIndex <= endItemIndex \? range\.endOffset : range\.startOffset,\s*pageIndex: pageNumber\s*\}\);/,
  `const startItemIndex = getPdfIndex(range.startContainer);
          const endItemIndex = getPdfIndex(range.endContainer);
             
          const getPdfPageIndex = (node) => {
            const pageContainer = node.nodeType === 3 ? node.parentElement?.closest('.react-pdf__Page') : node.closest('.react-pdf__Page');
            if (pageContainer) {
              return parseInt(pageContainer.getAttribute('data-page-number') || '-1', 10);
            }
            return pageNumber;
          };
          
          const selectionPageIndex = getPdfPageIndex(range.startContainer);

          if (startItemIndex !== -1 && endItemIndex !== -1) {
            setSelectionOffsets({
              startItemIndex: Math.min(startItemIndex, endItemIndex),
              startOffset: startItemIndex <= endItemIndex ? range.startOffset : range.endOffset,
              endItemIndex: Math.max(startItemIndex, endItemIndex),
              endOffset: startItemIndex <= endItemIndex ? range.endOffset : range.startOffset,
              pageIndex: selectionPageIndex
            });`
);
fs.writeFileSync('src/components/NativePdfReader.tsx', content);
