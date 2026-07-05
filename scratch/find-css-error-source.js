const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

function resolveImport(importPath, currentDir) {
  // Simple resolution
  if (importPath.startsWith('.') || importPath.startsWith('..')) {
    return path.resolve(currentDir, importPath);
  }
  
  // Try resolving package exports or main file from node_modules
  const pkgName = importPath.split('/')[0];
  const pkgJsonPath = path.join(projectRoot, 'node_modules', pkgName, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    if (importPath === pkgName) {
      // Main entry
      let mainFile = pkgJson.style || pkgJson.browser || pkgJson.main || 'index.css';
      if (mainFile.endsWith('.js') && pkgJson.style) {
        mainFile = pkgJson.style;
      }
      return path.resolve(projectRoot, 'node_modules', pkgName, mainFile);
    } else {
      // Subpath
      const subpath = importPath.slice(pkgName.length + 1);
      return path.resolve(projectRoot, 'node_modules', pkgName, subpath);
    }
  }
  return null;
}

const globalsCssPath = path.resolve(projectRoot, 'src/app/globals.css');
let globalsContent = fs.readFileSync(globalsCssPath, 'utf8');

// We will build a map of character ranges in the concatenated string to their source files
let concatenatedCss = '';
let sourceRanges = [];

// Simple regex to parse imports
const importRegex = /@import\s+["']([^"']+)["'];/g;
let lastIdx = 0;
let match;

while ((match = importRegex.exec(globalsContent)) !== null) {
  // Append text before import
  let textBefore = globalsContent.slice(lastIdx, match.index);
  if (textBefore.length > 0) {
    let startChar = concatenatedCss.length;
    concatenatedCss += textBefore;
    sourceRanges.push({ start: startChar, end: concatenatedCss.length, file: 'src/app/globals.css' });
  }

  // Resolve and read import
  const importName = match[1];
  if (importName !== 'tailwindcss') { // Skip tailwindcss base since it's processed internally by Tailwind v4 compiler
    const resolvedPath = resolveImport(importName, path.dirname(globalsCssPath));
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      console.log(`Resolving import: "${importName}" -> ${path.relative(projectRoot, resolvedPath)}`);
      let fileContent = fs.readFileSync(resolvedPath, 'utf8');
      let startChar = concatenatedCss.length;
      concatenatedCss += fileContent + '\n';
      sourceRanges.push({ start: startChar, end: concatenatedCss.length, file: resolvedPath });
    } else {
      console.log(`Warning: Could not resolve or read import: "${importName}"`);
    }
  }

  lastIdx = importRegex.lastIndex;
}

// Append remaining text of globals.css
let remainingText = globalsContent.slice(lastIdx);
if (remainingText.length > 0) {
  let startChar = concatenatedCss.length;
  concatenatedCss += remainingText;
  sourceRanges.push({ start: startChar, end: concatenatedCss.length, file: 'src/app/globals.css' });
}

console.log(`Total concatenated CSS length: ${concatenatedCss.length}`);

const targetIndex = 408572;
if (targetIndex < concatenatedCss.length) {
  const sliceStart = Math.max(0, targetIndex - 200);
  const sliceEnd = Math.min(concatenatedCss.length, targetIndex + 200);
  
  console.log('\n--- CONCATENATED CONTENT AROUND INDEX ---');
  console.log(concatenatedCss.slice(sliceStart, sliceEnd));
  console.log('-----------------------------------------');
  
  // Find which file this character belongs to
  const matchingRange = sourceRanges.find(r => targetIndex >= r.start && targetIndex <= r.end);
  if (matchingRange) {
    console.log(`\nSUCCESS! The character at index ${targetIndex} belongs to:`);
    console.log(`File: ${matchingRange.file}`);
    console.log(`Index relative to file: ${targetIndex - matchingRange.start}`);
    
    // Inspect local content of that file
    const fileContent = fs.readFileSync(matchingRange.file, 'utf8');
    const localIdx = targetIndex - matchingRange.start;
    const localStart = Math.max(0, localIdx - 100);
    const localEnd = Math.min(fileContent.length, localIdx + 100);
    console.log(`\nLocal content in source file around index:`);
    console.log(fileContent.slice(localStart, localEnd));
  } else {
    console.log(`\nCould not map index ${targetIndex} to any source file.`);
  }
} else {
  console.log(`\nTarget index ${targetIndex} is out of bounds (Max length is ${concatenatedCss.length}).`);
}
