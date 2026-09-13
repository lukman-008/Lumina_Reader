const fs = require('fs');

let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

if (!content.includes('<HighlightPopover')) {
  content = content.replace(
    /<AIAssistantDrawer/,
    `{activeHighlightPopover && (
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
      <AIAssistantDrawer`
  );
  fs.writeFileSync('src/components/NativePdfReader.tsx', content);
}
