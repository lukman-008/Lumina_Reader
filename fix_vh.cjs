const fs = require('fs');
const path = require('path');

const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(componentsDir, file);
    let code = fs.readFileSync(filePath, 'utf8');
    let patched = false;
    
    // Replace max-h-[XXvh] with max-h-[XXdvh]
    const regex = /max-h-\[(\d+)vh\]/g;
    if (regex.test(code)) {
      code = code.replace(regex, 'max-h-[$1dvh]');
      patched = true;
    }
    
    // Check if modal inner content is scrollable
    // Often we see <div className="... flex flex-col max-h-[90dvh]">
    // The children should have flex-1 overflow-y-auto to actually scroll within the max height
    if (patched) {
      fs.writeFileSync(filePath, code);
      console.log(`Patched vh -> dvh in ${file}`);
    }
  }
});
