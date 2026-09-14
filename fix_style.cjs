const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

code = code.replace(/<style>[\s\S]*?<\/style>/, `
      <style dangerouslySetInnerHTML={{ __html: \`
        .react-pdf__Page__textContent, .textLayer {
          color-scheme: only light;
          position: absolute;
          text-align: initial;
          inset: 0;
          overflow: clip;
          opacity: 1;
          line-height: 1;
          text-size-adjust: none;
          forced-color-adjust: none;
          transform-origin: 0 0;
          caret-color: CanvasText;
          z-index: 0;
          border-radius: 0;
        }
        .react-pdf__Page__textContent span, .textLayer :is(span, br) {
          color: transparent !important;
          position: absolute;
          white-space: pre;
          cursor: text;
          margin: 0;
          transform-origin: 0 0;
        }
        .react-pdf__Page__textContent span::selection, .textLayer :is(span, br)::selection {
          background: rgba(0, 102, 255, 0.25) !important;
          color: transparent !important;
        }
        .react-pdf__Page__textContent span::-moz-selection, .textLayer :is(span, br)::-moz-selection {
          background: rgba(0, 102, 255, 0.25) !important;
          color: transparent !important;
        }
        .react-pdf__Page__canvas {
          display: block !important;
          margin: 0 auto !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
      \` }} />
`);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
