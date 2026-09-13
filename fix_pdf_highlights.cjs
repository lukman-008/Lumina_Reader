const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Find the old customTextRenderer definition and replace it
const oldFuncStart = `  const customTextRenderer = useCallback((textItem: any) => {
    const { str, itemIndex } = textItem;
    // pageIndex isn't directly in textItem, but textItem is bound per page if we wanted.
    // Actually, we can just use the fact that itemIndex is unique per page.
    let result = str;`;

const newFuncStart = `  const makeCustomTextRenderer = useCallback((renderPageIndex: number) => {
    return (textItem: any) => {
      const { str, itemIndex } = textItem;
      let result = str;`;

content = content.replace(oldFuncStart, newFuncStart);

// 2. Add the pageIndex check inside the loop
content = content.replace(
  /for \(const h of highlights\) \{/,
  `for (const h of highlights) {
      if (h.pageIndex !== undefined && h.pageIndex !== renderPageIndex) continue;`
);

// 3. Fix the end of the callback
const oldFuncEnd = `    return result;
  }, [highlights]);`;

const newFuncEnd = `    return result;
    };
  }, [highlights]);`;

content = content.replace(oldFuncEnd, newFuncEnd);

// 4. Update the JSX where customTextRenderer is used
content = content.replace(/customTextRenderer=\{customTextRenderer\}/g, 'customTextRenderer={makeCustomTextRenderer(pageNumber)}');

// Wait! In Double mode, the right page should be makeCustomTextRenderer(pageNumber + 1)
// Let's replace them carefully.
fs.writeFileSync('src/components/NativePdfReader.tsx', content);
