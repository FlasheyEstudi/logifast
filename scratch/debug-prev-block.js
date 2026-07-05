const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const idx = content.indexOf('.md\\:advance-select-menu');
  if (idx !== -1) {
    console.log('--- CONTENT BEFORE .md\\:advance-select-menu ---');
    console.log(content.slice(idx - 400, idx + 100));
    console.log('------------------------------------------------');
  } else {
    console.log('Not found');
  }
} else {
  console.log('File not found');
}
