const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  let idx = 0;
  console.log('--- MEDIA QUERIES ---');
  while ((idx = content.indexOf('@media', idx)) !== -1) {
    console.log(`Found @media at index ${idx}:`);
    console.log(content.slice(idx, idx + 150));
    console.log('---------------------');
    idx += 6;
  }
} else {
  console.log('File not found');
}
