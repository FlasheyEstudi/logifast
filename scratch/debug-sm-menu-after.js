const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/flyonui.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const idx = content.indexOf('.sm\\:advance-select-menu');
  if (idx !== -1) {
    console.log('--- CONTENT AROUND .sm\\:advance-select-menu ---');
    console.log(content.slice(idx, idx + 1500));
    console.log('-----------------------------------------------');
  } else {
    console.log('Not found');
  }
} else {
  console.log('File not found');
}
