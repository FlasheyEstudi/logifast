const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/flyonui.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const idx = content.indexOf('.md\\:advance-select-menu');
  if (idx !== -1) {
    console.log('Found .md\\:advance-select-menu at index:', idx);
    console.log(content.slice(idx - 300, idx + 400));
  } else {
    console.log('Not found');
  }
} else {
  console.log('File not found');
}
