const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const effect = `
  // Sync Zen Mode with native fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsZenMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
`;

content = content.replace(
  /const handleToggleZenMode = \(\) => \{/,
  effect + '\n  const handleToggleZenMode = () => {'
);

fs.writeFileSync('src/App.tsx', content);
