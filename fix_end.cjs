const fs = require('fs');
let code = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

code = code.replace(
  "    </div>\n  );\n}",
  "      </ErrorBoundary>\n    </div>\n  );\n}"
);

fs.writeFileSync('src/components/NativePdfReader.tsx', code);
