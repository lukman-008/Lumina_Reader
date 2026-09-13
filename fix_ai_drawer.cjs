const fs = require('fs');

let content = fs.readFileSync('src/components/AIAssistantDrawer.tsx', 'utf8');

if (!content.includes('useEffect(() => {')) {
  // Add useEffect import
  content = content.replace(
    /import React, \{ useState \} from 'react';/,
    `import React, { useState, useEffect } from 'react';`
  );
  
  // Add useEffect to sync selectedText
  content = content.replace(
    /const \[wordToExplain, setWordToExplain\] = useState\(selectedText \|\| ''\);/,
    `$&
  useEffect(() => {
    if (selectedText) {
      setWordToExplain(selectedText);
    }
  }, [selectedText]);`
  );
}

fs.writeFileSync('src/components/AIAssistantDrawer.tsx', content);
