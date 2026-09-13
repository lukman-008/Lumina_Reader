const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

if (!content.includes('activeHighlightPopover')) {
  // Add state
  content = content.replace(
    /const \[highlights, setHighlights\] = useState<any\[\]>\(\[\]\);/,
    `$&
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<{ highlight: any, position: {x: number, y: number} } | null>(null);`
  );
}

// Ensure the HighlightPopover component is imported
if (!content.includes("import { HighlightPopover }")) {
  content = content.replace(
    /import \{ SelectionPopup \} from '\.\/SelectionPopup';/,
    `import { SelectionPopup } from './SelectionPopup';
import { HighlightPopover } from './HighlightPopover';`
  );
}

// Add handleUpdateHighlight and handleDeleteHighlight for PDF
if (!content.includes('const handleUpdateHighlight')) {
  content = content.replace(
    /const handleCreateHighlight = async/,
    `
  const handleUpdateHighlight = async (id: string, updates: any) => {
    await db.highlights.update(id, updates);
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    if (activeHighlightPopover && activeHighlightPopover.highlight.id === id) {
      setActiveHighlightPopover({
        ...activeHighlightPopover,
        highlight: { ...activeHighlightPopover.highlight, ...updates },
      });
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    await db.highlights.delete(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setActiveHighlightPopover(null);
  };
  $&`
  );
}

// Add the HighlightPopover JSX at the end of the return statement before <AIAssistantDrawer
if (!content.includes('<HighlightPopover')) {
  content = content.replace(
    /\{isAIOpen && \(/,
    `
      {activeHighlightPopover && (
        <HighlightPopover
          highlight={activeHighlightPopover.highlight}
          position={activeHighlightPopover.position}
          onClose={() => setActiveHighlightPopover(null)}
          onUpdateHighlight={handleUpdateHighlight}
          onDeleteHighlight={handleDeleteHighlight}
          onAskAI={(text) => {
            setSelectedText(text);
            setIsAIOpen(true);
            setActiveHighlightPopover(null);
          }}
        />
      )}
      $&`
  );
}

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
