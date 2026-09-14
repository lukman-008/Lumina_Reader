const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

content = content.replace(
  /  const startTTS = \([\s\S]*?  \};\n\n  return \(\) => \{/m,
  `  return () => {`
);

content = content.replace(
  /  const handleUpdateHighlight = async \(id: string, updates: any\) => \{/,
  `  const startTTS = (customText?: string) => {
    const textToSpeak = customText || selectedText || "Please highlight text to use Text-to-Speech in PDF mode.";
    ttsService.speakText(textToSpeak, { rate: 1.0 });
    setIsTTSOpen(true);
    setSelectionPosition(null);
  };

  const handleUpdateHighlight = async (id: string, updates: any) => {`
);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
