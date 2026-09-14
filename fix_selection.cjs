const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\/\* Fix react-pdf text layer against Tailwind CSS resets \*\/[\s\S]*$/, '');

css += `
/* Fix react-pdf text layer against Tailwind CSS resets */
.react-pdf__Page__textContent {
  border-radius: 0;
}
.react-pdf__Page__textContent span,
.react-pdf__Page__textContent span::selection,
.react-pdf__Page__textContent span::-moz-selection {
  color: transparent !important;
}
.react-pdf__Page__textContent span::selection {
  background: rgba(0, 102, 255, 0.25) !important;
}
.react-pdf__Page__textContent span::-moz-selection {
  background: rgba(0, 102, 255, 0.25) !important;
}
`;

fs.writeFileSync('src/index.css', css);
