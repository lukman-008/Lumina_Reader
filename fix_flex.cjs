const fs = require('fs');
const path = require('path');

const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(componentsDir, file);
    let code = fs.readFileSync(filePath, 'utf8');
    let patched = false;
    
    // Replace non-wrapping flex justify-between headers with flex-wrap where safe
    const target1 = '<div className="flex items-center justify-between pb-';
    if (code.includes(target1)) {
      code = code.replaceAll(target1, '<div className="flex flex-wrap gap-2 items-center justify-between pb-');
      patched = true;
    }

    const target2 = '<div className="flex items-center justify-between pt-';
    if (code.includes(target2)) {
      code = code.replaceAll(target2, '<div className="flex flex-wrap gap-2 items-center justify-between pt-');
      patched = true;
    }
    
    const target3 = '<div className="flex items-center justify-between mb-';
    if (code.includes(target3)) {
      code = code.replaceAll(target3, '<div className="flex flex-wrap gap-2 items-center justify-between mb-');
      patched = true;
    }

    const target4 = '<div className="flex items-center justify-between">';
    if (code.includes(target4)) {
      code = code.replaceAll(target4, '<div className="flex flex-wrap gap-2 items-center justify-between">');
      patched = true;
    }
    
    // Check for truncate
    const truncateRegex = /truncate max-w-\[([^\]]+)\]/g; // This is safe.
    const truncateWithoutParentRegex = /className="[^"]*truncate[^"]*"/g;
    
    // Check missing min-w-0 on flex children if they have truncate? Too complex for regex safely.
    
    if (patched) {
      fs.writeFileSync(filePath, code);
      console.log(`Patched flex wrap in ${file}`);
    }
  }
});
