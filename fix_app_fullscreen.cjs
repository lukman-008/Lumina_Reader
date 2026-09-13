const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const toggleFullscreen = \(\) => \{\n    if \(\!document\.fullscreenElement\) \{\n      document\.documentElement\.requestFullscreen\(\)\.catch\(\(\) => \{\}\);\n    \} else \{\n      document\.exitFullscreen\(\)\.catch\(\(\) => \{\}\);\n    \}\n  \};/,
  `const handleToggleZenMode = () => {
    setIsZenMode((prev) => {
      const next = !prev;
      if (next) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };`
);

content = content.replace(/onToggleZenMode=\{.*?setIsZenMode.*?}/g, 'onToggleZenMode={handleToggleZenMode}');

fs.writeFileSync('src/App.tsx', content);
