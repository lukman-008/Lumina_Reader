const fs = require('fs');

let content = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

const replacement = `
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{progress > 0 ? \`\${progress}% Completed\` : 'Not Started'}</span>
                      <span>
                        {book.format === 'pdf' 
                          ? 'PDF Document' 
                          : estMinutes >= 60 
                            ? \`~\${Math.floor(estMinutes / 60)}h \${estMinutes % 60}m\` 
                            : \`~\${estMinutes}m total\`}
                      </span>
                    </div>
`;

content = content.replace(
  /<div className="flex items-center justify-between text-\[11px\] text-slate-400">\s*<span>\{progress > 0 \? `\$\{progress\}% Completed` : 'Not Started'\}<\/span>\s*<span>~\{estMinutes\}m total<\/span>\s*<\/div>/,
  replacement.trim()
);

fs.writeFileSync('src/components/LibraryView.tsx', content);
