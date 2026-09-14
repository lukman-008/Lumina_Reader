const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Remove the bad overrides
css = css.replace(/\/\* Ensure react-pdf canvas is visible and text layer is correct \*\/[\s\S]*?\.react-pdf__Page__textContent span \{[\s\S]*?\}/, '');

fs.writeFileSync('src/index.css', css);
