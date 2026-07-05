const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const idx = content.indexOf('.advance-select-menu{');
  if (idx !== -1) {
    // Find matching closing brace
    let braceCount = 0;
    let endIdx = -1;
    for (let i = idx; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIdx = i;
          break;
        }
      }
    }
    console.log('--- FULL BASE CLASS ---');
    console.log(content.slice(idx, endIdx + 1));
    console.log('-----------------------');
  } else {
    console.log('Not found');
  }
} else {
  console.log('File not found');
}
