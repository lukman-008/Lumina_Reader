const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const updated = `
  const handleToggleZenMode = () => {
    setIsZenMode((prev) => {
      const next = !prev;
      
      try {
        if (next) {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
          }
        } else {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      } catch (err) {
        console.warn('Fullscreen API error:', err);
      }
      
      return next;
    });
  };
`;

content = content.replace(/const handleToggleZenMode = \(\) => \{[\s\S]*?return next;\n    \}\);\n  \};/, updated.trim());

fs.writeFileSync('src/App.tsx', content);
