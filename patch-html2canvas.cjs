const fs = require('fs');
const path = require('path');

const targetFiles = [
  'node_modules/html2canvas/dist/html2canvas.js',
  'node_modules/html2canvas/dist/html2canvas.esm.js',
  'node_modules/html2canvas/dist/html2canvas.min.js',
  'node_modules/html2canvas/dist/lib/css/types/color.js',
  'node_modules/.vite/deps/html2canvas.js'
];

targetFiles.forEach((rel) => {
  const file = path.resolve(__dirname, rel);
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace: throw new Error("Attempting to parse an unsupported color function \"" + value.name + "\"");
    if (content.includes('Attempting to parse an unsupported color function')) {
      content = content.replace(
        /if\s*\(\s*typeof\s+colorFunction\s*===\s*['"]undefined['"]\s*\)\s*\{\s*throw\s+new\s+Error\([^)]*unsupported\s+color\s+function[^)]*\);\s*\}/g,
        'if (typeof colorFunction === "undefined") { return (typeof pack === "function" ? pack(15, 118, 110, 1) : 0); }'
      );
      content = content.replace(
        /throw\s+new\s+Error\([^)]*unsupported\s+color\s+function[^)]*\);?/g,
        'return (typeof pack === "function" ? pack(15, 118, 110, 1) : 0);'
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Patched:', rel);
    }
  }
});
