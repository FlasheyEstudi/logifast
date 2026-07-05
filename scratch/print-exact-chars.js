const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const idx = content.indexOf('.md\\:advance-select-menu');
  if (idx !== -1) {
    const slice = content.slice(idx, idx + 200);
    console.log('--- EXACT SLICE ---');
    console.log(slice);
    console.log('--- CHAR CODES ---');
    for (let i = 0; i < Math.min(slice.length, 120); i++) {
      console.log(`${slice[i]} -> ${slice.charCodeAt(i)}`);
    }
  } else {
    console.log('Not found');
  }
} else {
  console.log('File not found');
}
