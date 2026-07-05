const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/flyonui.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  let idx = 0;
  let count = 0;
  console.log('--- DOUBLE SEMICOLONS ---');
  while ((idx = content.indexOf(';;', idx)) !== -1) {
    console.log(`Found ;; at index ${idx}:`);
    console.log(content.slice(Math.max(0, idx - 50), Math.min(content.length, idx + 50)));
    console.log('-------------------------');
    idx += 2;
    count++;
  }
  console.log(`Total found: ${count}`);
} else {
  console.log('File not found');
}
