const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/flyonui/components/advanceSelect.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const r1 = /z-index:10;width:100%;:where\(&>:not\(:last-child\)\)\{([^{}]+)\}/;
  console.log('R1 match:', !!content.match(r1));
  
  const r2 = /z-index:10;width:100%;:where\(&>:not\(:last-child\)\)\{([^{}]+)\}border-radius:var\(--radius-box\);/;
  console.log('R2 match:', !!content.match(r2));
  
  const r3 = /z-index:10;width:100%;:where\(&>:not\(:last-child\)\)\{([^{}]+)\}border-radius:var\(--radius-box\);background-color:var\(--color-base-100\);/;
  console.log('R3 match:', !!content.match(r3));
  
  const r4 = /z-index:10;width:100%;:where\(&>:not\(:last-child\)\)\{([^{}]+)\}border-radius:var\(--radius-box\);background-color:var\(--color-base-100\);--tw-shadow:([^;]+);/;
  console.log('R4 match:', !!content.match(r4));
} else {
  console.log('File not found');
}
