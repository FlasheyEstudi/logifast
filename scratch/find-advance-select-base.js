const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Find index of .advance-select-menu{
  const idx = content.indexOf('.advance-select-menu{');
  if (idx !== -1) {
    console.log('Found .advance-select-menu{ at index:', idx);
    console.log(content.slice(idx, idx + 600));
  } else {
    console.log('Not found');
  }
} else {
  console.log('File not found');
}
