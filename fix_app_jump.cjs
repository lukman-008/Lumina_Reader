const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const updatedJump = `
  const handleNavigateToResult = useCallback(
    async (bookId: string, chapterIndex: number, _snippetOrText?: string, highlightId?: string) => {
      const targetBook = books.find((b) => b.id === bookId);
      if (targetBook) {
        let clampedIndex = chapterIndex;
        let cPageIdx = 0;
        
        if (targetBook.format !== 'pdf') {
          clampedIndex = Math.min(
            Math.max(0, chapterIndex),
            Math.max(0, targetBook.chapters.length - 1)
          );
        } else {
          // For PDFs, chapterIndex is used as the zero-indexed page number in some places
          cPageIdx = chapterIndex;
          clampedIndex = chapterIndex;
        }

        const percentage = Math.round(
          ((clampedIndex + 1) / Math.max(1, targetBook.chapters.length)) * 100
        );

        const updatedProgress = {
          currentChapterIndex: clampedIndex,
          currentPageIndex: cPageIdx,
          scrollOffset: 0,
          percentage,
          lastReadTimestamp: Date.now(),
          totalReadTimeSeconds: targetBook.readingProgress?.totalReadTimeSeconds || 0,
          readingVelocityWPM: targetBook.readingProgress?.readingVelocityWPM || 250,
        };

        const updatedBook: Book = {
          ...targetBook,
          readingProgress: updatedProgress,
        };

        await db.books.put(updatedBook);
        setSelectedBook(updatedBook);
        setIsSearchIndexOpen(false);
        if (highlightId) setTargetHighlightId(highlightId);
        setIsAnnotationManagerOpen(false);
        refreshBooks();
      }
    },
    [books]
  );
`;

content = content.replace(
  /  const handleNavigateToResult = useCallback\([\s\S]*?refreshBooks\(\);\n      \}\n    \},\n    \[books\]\n  \);/,
  updatedJump.trim()
);

fs.writeFileSync(file, content);
