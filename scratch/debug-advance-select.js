const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('File size:', content.length);
  // Find index of .md\:advance-select-menu
  const idx = content.indexOf('.md\\:advance-select-menu');
  if (idx !== -1) {
    console.log('Found .md\\:advance-select-menu at index:', idx);
    console.log(content.slice(idx - 100, idx + 400));
  } else {
    console.log('Could not find .md\\:advance-select-menu in advanceSelect.css');
  }
} else {
  console.log('File not found:', filePath);
}
