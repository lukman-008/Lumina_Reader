const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

code = code.replace(
  "pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();",
  "pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();"
);

code = `import { ErrorBoundary } from './ErrorBoundary';\n` + code;

code = code.replace(
  "<div className={`w-full flex flex-col transition-colors duration-200 relative overflow-hidden ${themeStyle.bg} ${themeStyle.text} ${isZenMode ? 'h-screen' : 'h-[calc(100vh-2.75rem)]'}`}>",
  "<div className={`w-full flex flex-col transition-colors duration-200 relative overflow-hidden ${themeStyle.bg} ${themeStyle.text} ${isZenMode ? 'h-screen' : 'h-[calc(100vh-2.75rem)]'}`}>\n      <ErrorBoundary>"
);

// We need to find the matching closing div and inject </ErrorBoundary> right before it
code = code.replace(
  "    </div>\n  );\n};",
  "      </ErrorBoundary>\n    </div>\n  );\n};"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
