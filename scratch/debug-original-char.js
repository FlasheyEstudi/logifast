const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/flyonui.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const targetIndex = 393663;
  const start = Math.max(0, targetIndex - 200);
  const end = Math.min(content.length, targetIndex + 200);
  console.log('--- SURROUNDING CONTENT ---');
  console.log(content.slice(start, end));
  console.log('---------------------------');
  console.log(`Character at index ${targetIndex} is: "${content[targetIndex]}"`);
} else {
  console.log('File not found:', filePath);
}
