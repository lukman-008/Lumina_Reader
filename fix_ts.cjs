const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/document\.documentElement\.webkitRequestFullscreen/g, '(document.documentElement as any).webkitRequestFullscreen');
content = content.replace(/document\.webkitExitFullscreen/g, '(document as any).webkitExitFullscreen');
fs.writeFileSync('src/App.tsx', content);
