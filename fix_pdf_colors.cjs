const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const replacement = `
  const highlightColors: Record<string, string> = {
    yellow: 'background-color: rgba(251, 191, 36, 0.4); border-bottom: 2px solid rgba(251, 191, 36, 0.9); color: inherit;',
    emerald: 'background-color: rgba(52, 211, 153, 0.4); border-bottom: 2px solid rgba(52, 211, 153, 0.9); color: inherit;',
    sky: 'background-color: rgba(56, 189, 248, 0.4); border-bottom: 2px solid rgba(56, 189, 248, 0.9); color: inherit;',
    rose: 'background-color: rgba(251, 113, 133, 0.4); border-bottom: 2px solid rgba(251, 113, 133, 0.9); color: inherit;',
    amber: 'background-color: rgba(251, 146, 60, 0.4); border-bottom: 2px solid rgba(251, 146, 60, 0.9); color: inherit;',
    violet: 'background-color: rgba(192, 132, 252, 0.4); border-bottom: 2px solid rgba(192, 132, 252, 0.9); color: inherit;',
  };

  const customTextRenderer = (textItem: any) => {
    const { str, itemIndex } = textItem;
    // Find highlights that apply to this page (or nearby pages in double/scroll mode)
    // We just check all highlights for simplicity, filtering by current book
    
    let result = str;
    for (const h of highlights) {
      if (str.includes(h.selectedText)) {
        // Wrap the exact matched part in a mark element. 
        // Note: react-pdf uses innerHTML for customTextRenderer string outputs.
        const style = highlightColors[h.color] || highlightColors.yellow;
        result = result.replace(
          h.selectedText,
          \`<mark style="\${style}">\${h.selectedText}</mark>\`
        );
      } else if (h.selectedText.includes(str) && str.trim().length > 3) {
        // If the span is a sub-part of a larger highlight
        const style = highlightColors[h.color] || highlightColors.yellow;
        result = \`<mark style="\${style}">\${str}</mark>\`;
      }
    }
    return result;
  };
`;

content = content.replace(/const customTextRenderer = \(textItem: any\) => \{[\s\S]*?return result;\n  \};/, replacement.trim());

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
