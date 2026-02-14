import fs from 'fs';
import path from 'path';

const extractDir = '/tmp/extracted';
const targetDir = '/tmp/project-files';

// Read all files recursively and output their paths and content as JSON
function getAllFiles(dir, prefix = '') {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      results.push(...getAllFiles(fullPath, relativePath));
    } else {
      results.push(relativePath);
    }
  }
  return results;
}

const files = getAllFiles(extractDir);
console.log(JSON.stringify(files));
