const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/flyonui.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const targetIndex = 393777;
  const start = Math.max(0, targetIndex - 300);
  const end = Math.min(content.length, targetIndex + 300);
  console.log('--- SURROUNDING CONTENT ---');
  console.log(content.slice(start, end));
  console.log('---------------------------');
} else {
  console.log('File not found:', filePath);
}
