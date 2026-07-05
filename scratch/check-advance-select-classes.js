const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/flyonui.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Find all selectors matching .[sm|md|lg|xl|2xl]*:advance-select...
  const regex = /\.[a-zA-Z0-9\\:\-_]+advance-select[a-zA-Z0-9\\:\-_]*/g;
  let match;
  console.log('--- ADVANCE SELECT CLASSES IN FLYONUI.CSS ---');
  while ((match = regex.exec(content)) !== null) {
    console.log(`Class: ${match[0]} at index ${match.index}`);
  }
} else {
  console.log('File not found');
}
