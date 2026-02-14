import fs from 'fs';
import path from 'path';

const extractDir = '/tmp/extracted';

// Skip these - they already exist or are binary
const skipPatterns = [
  /^\.git/,
  /^node_modules/,
  /^pnpm-lock\.yaml$/,
];

const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.svg'];

function getAllFiles(dir, prefix = '') {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      results.push(...getAllFiles(fullPath, relativePath));
    } else {
      results.push({ fullPath, relativePath });
    }
  }
  return results;
}

const files = getAllFiles(extractDir);

// Print text files
for (const { fullPath, relativePath } of files) {
  if (skipPatterns.some(p => p.test(relativePath))) continue;
  
  const ext = path.extname(relativePath).toLowerCase();
  const isBinary = binaryExtensions.includes(ext);
  
  if (isBinary) {
    const stat = fs.statSync(fullPath);
    console.log(`===BINARY_FILE: ${relativePath} (${stat.size} bytes)===`);
  } else {
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      console.log(`===START_FILE: ${relativePath}===`);
      console.log(content);
      console.log(`===END_FILE: ${relativePath}===`);
    } catch (e) {
      console.log(`===ERROR_FILE: ${relativePath}: ${e.message}===`);
    }
  }
}
