const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../node_modules/flyonui');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

function fixNestingOrder(content) {
  const pattern = /:where\(&>:not\(:last-child\)\)\{([^{}]+)\}(;)?/g;
  let match;
  let modified = false;
  
  while ((match = pattern.exec(content)) !== null) {
    const matchStart = match.index;
    const matchEnd = pattern.lastIndex;
    const innerContent = match[1];
    
    let braceCount = 0;
    let parentStart = -1;
    for (let i = matchStart - 1; i >= 0; i--) {
      if (content[i] === '}') braceCount--;
      if (content[i] === '{') {
        braceCount++;
        if (braceCount === 1) {
          parentStart = i;
          break;
        }
      }
    }
    
    if (parentStart === -1) continue;
    
    braceCount = 1;
    let parentEnd = -1;
    for (let i = parentStart + 1; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          parentEnd = i;
          break;
        }
      }
    }
    
    if (parentEnd === -1) continue;
    
    const textAfterNested = content.slice(matchEnd, parentEnd).trim();
    if (textAfterNested === '' || textAfterNested === ';') {
      continue;
    }
    
    const beforeNested = content.slice(parentStart + 1, matchStart);
    const afterNested = content.slice(matchEnd, parentEnd);
    
    const cleanInner = innerContent.trim().endsWith(';') ? innerContent.trim() : `${innerContent.trim()};`;
    const nestedBlockStr = `:where(&>:not(:last-child)){${cleanInner}}`;
    
    let newParentContent = (beforeNested + afterNested).trim();
    if (!newParentContent.endsWith(';')) {
      newParentContent += ';';
    }
    newParentContent += nestedBlockStr;
    
    content = content.slice(0, parentStart + 1) + newParentContent + content.slice(parentEnd);
    pattern.lastIndex = 0;
    modified = true;
  }
  
  return { content, modified };
}

console.log('Fixing CSS syntax, spaces and nesting order in flyonui CSS files...');
let count = 0;

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    const baseName = path.basename(filePath);
    const isCompiledFile = baseName === 'flyonui.css' || baseName === 'themes.css' || baseName === 'variants.css';

    // Fix 1: General fix for missing semicolon before @media at-rule (e.g. cubic-bezier(...)@media -> cubic-bezier(...);@media, 0@media -> 0;@media)
    content = content.replace(/([0-9a-zA-Z-_\(\)]+)@media/g, '$1;@media');

    // Fix 2: AST-based Nested Rule Reordering (ONLY on source components, NOT compiled/minified files!)
    if (!isCompiledFile) {
      const result = fixNestingOrder(content);
      content = result.content;
    }

    // Fix 2.5: Clean up redundant SASS nested hover media queries that cause parser crash
    content = content.replace(/:hover\{&:hover\{@media \(hover:hover\)\{([^{}]+)\}\}\}/g, ':hover{@media (hover:hover){$1}}');

    // Fix 3: General fix for missing space between closing parenthesis and any letter (e.g. transparent)var -> transparent) var, var(--border)solid -> var(--border) solid)
    content = content.replace(/\)(?=[a-z])/g, ') ');

    // Fix 3.5: Missing semicolon between closing parenthesis and nested ampersand (e.g. var(--radius-field))& -> var(--radius-field));&)
    content = content.replace(/\)(?=&)/g, ');&');

    // Fix 3.6: Missing semicolon between closing parenthesis and class rule (e.g. var(--radius-field)).md\:input -> var(--radius-field));.md\:input)
    content = content.replace(/\)(?=\.[a-z])/g, ');.');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`- Fixed: ${path.relative(targetDir, filePath)}`);
      count++;
    }
  }
});

console.log(`Done! Fixed ${count} files.`);
