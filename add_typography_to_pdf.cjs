const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /Volume2, Zap \} from 'lucide-react';/,
  `Volume2, Zap, Sliders } from 'lucide-react';`
);

content = content.replace(
  /import { RSVPModal } from '\.\/RSVPModal';/,
  `import { RSVPModal } from './RSVPModal';
import { TypographyToolbar } from './TypographyToolbar';`
);

content = content.replace(
  /const \[isRSVPOpen, setIsRSVPOpen\] = useState\(false\);/,
  `const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);`
);

content = content.replace(
  /<button[\s\S]*?onClick=\{\(\) => setIsSoundscapeOpen\(true\)\}/,
  `<button
              onClick={() => setIsTypographyOpen((prev) => !prev)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${isTypographyOpen ? 'text-amber-500' : themeStyle.text}\`}
              title="Typography & Display Controls"
            >
              <Sliders className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsSoundscapeOpen(true)}`
);

content = content.replace(
  /\{\/\* Soundscape Modal \*\/\}/,
  `{/* Typography Toolbar Popover */}
      <TypographyToolbar
        isOpen={isTypographyOpen}
        onClose={() => setIsTypographyOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Soundscape Modal */}`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
