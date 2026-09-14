const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// 1. Remove pdfViewMode and pdfPaperColor state
content = content.replace(/const \[pdfViewMode, setPdfViewMode\][\s\S]*?setIsExtractingText\(false\);/, '');

// 2. Remove extraction effect and formatBionicText
const extractLogicRegex = /\/\/ Extract text for Reader Mode[\s\S]*?const formatBionicText = [\s\S]*?};\n/m;
content = content.replace(extractLogicRegex, '');

// 3. Remove Reader Mode and Paper Color buttons
const buttonsRegex = /<button[\s\S]*?onClick=\{\(\) => setPdfViewMode[\s\S]*?<\/button>\s*<button[\s\S]*?onClick=\{\(\) => \{[\s\S]*?const colors: \('white' \| 'black' \| 'transparent'\)\[\] = \['white', 'black', 'transparent'\];[\s\S]*?<\/button>/m;
// Wait, in fix_zen_nav.cjs, I removed the Paper Color button, leaving only BookOpen (Reader Mode) and Theme (Appearance).
// Let's just find BookOpen button and remove it.

const bookOpenBtnRegex = /<button[\s\S]*?BookOpen[\s\S]*?<\/button>\s*/m;
content = content.replace(bookOpenBtnRegex, '');

// 4. Remove the Reader Mode rendering block.
const readerModeRenderRegex = /\{pdfViewMode === 'reader' \? \([\s\S]*?\) : \(/m;
content = content.replace(readerModeRenderRegex, '');

// 5. Remove the closing brace of the Reader Mode block
// Look for </Document>\n            </div>\n            )}
content = content.replace(/<\/Document>\s*<\/div>\s*\)}/, '</Document>\n            </div>');

// 6. Force the page wrappers to always be white
content = content.replace(/\$\{pdfPaperColor === 'white' \? 'bg-white' : pdfPaperColor === 'black' \? 'bg-black' : 'bg-transparent'\}/g, 'bg-white');


// Also remove pdfPaperColor from state if it exists
content = content.replace(/const \[pdfPaperColor, setPdfPaperColor\] = useState<'white' \| 'black' \| 'transparent'>\('white'\);\n/, '');

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
