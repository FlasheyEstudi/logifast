const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const idx = content.indexOf(':where(&>:not(:last-child))');
  if (idx !== -1) {
    console.log('Found :where at index:', idx);
    console.log(content.slice(idx - 100, idx + 300));
  } else {
    console.log('Not found');
  }
} else {
  console.log('File not found');
}
