const fs = require('fs');
let content = fs.readFileSync('src/components/ReaderView.tsx', 'utf8');

// 1. Update pages generation
content = content.replace(
  /const pages = useMemo\(\(\) => \{[\s\S]*?\}, \[currentChapter\.content, wordsPerPage\]\);/,
  `const pages = useMemo(() => {
    const paragraphs = currentChapter.content.split('\\n\\n').filter(Boolean);
    const result: {text: string, globalIndex: number}[][] = [];
    let currentPage: {text: string, globalIndex: number}[] = [];
    let currentWordCount = 0;

    paragraphs.forEach((p, idx) => {
      const words = p.split(/\\s+/).length;
      if (currentWordCount + words > wordsPerPage && currentPage.length > 0) {
        result.push(currentPage);
        currentPage = [{text: p, globalIndex: idx}];
        currentWordCount = words;
      } else {
        currentPage.push({text: p, globalIndex: idx});
        currentWordCount += words;
      }
    });

    if (currentPage.length > 0) {
      result.push(currentPage);
    }

    return result.length > 0 ? result : [[{text: currentChapter.content, globalIndex: 0}]];
  }, [currentChapter.content, wordsPerPage]);`
);

// 2. Update renderParagraphContent signature and highlight filter
content = content.replace(
  /const renderParagraphContent = \(paragraphText: string\) => \{[\s\S]*?if \(chapterHighlights\.length === 0\)/,
  `const renderParagraphContent = (paragraphText: string, globalIndex: number) => {
    const chapterHighlights = highlights.filter(
      (h) => h.chapterIndex === currentChapterIndex && h.startItemIndex === globalIndex && paragraphText.includes(h.selectedText)
    );

    if (chapterHighlights.length === 0)`
);

// 3. Update renderParagraphBlock signature and JSX
content = content.replace(
  /const renderParagraphBlock = \(p: string, idx: number\) => \{[\s\S]*?const imgMatch = p\.match/,
  `const renderParagraphBlock = (p: {text: string, globalIndex: number}, idx: number) => {
    // 1. Markdown Images
    const imgMatch = p.text.match`
);

content = content.replace(
  /const headingMatch = p\.match/,
  `const headingMatch = p.text.match`
);

// 4. Update the renderParagraphContent calls inside renderParagraphBlock
content = content.replace(/\{renderParagraphContent\(content\)\}/, '{renderParagraphContent(content, p.globalIndex)}');
content = content.replace(/\{renderParagraphContent\(p\)\}/, '{renderParagraphContent(p.text, p.globalIndex)}');

// 5. Add data-paragraph-index to the wrapper elements in renderParagraphBlock
content = content.replace(/<HeadingTag key=\{idx\}/, '<HeadingTag key={idx} data-paragraph-index={p.globalIndex}');
content = content.replace(/<p key=\{idx\}/, '<p key={idx} data-paragraph-index={p.globalIndex}');

// 6. Update JSX calls to renderParagraphBlock
// Wait, the double layout uses `.map((p, idx) => renderParagraphBlock(p, idx))` which doesn't need to change if `p` is now `{text, globalIndex}`!
// The continuous scroll mode uses `currentChapter.content.split('\n\n').map(...)`. We need to fix that one too!
content = content.replace(
  /currentChapter\.content\.split\('\\n\\n'\)\.map\(\(p, idx\) => renderParagraphBlock\(p, idx\)\)/,
  `currentChapter.content.split('\\n\\n').map((text, idx) => renderParagraphBlock({text, globalIndex: idx}, idx))`
);

fs.writeFileSync('src/components/ReaderView.tsx', content);
