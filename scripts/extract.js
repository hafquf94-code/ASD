import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Find the zip file
const zipFile = '/vercel/share/v0-project/joebek-auto-mart-pos (1).zip';
const extractDir = '/tmp/extracted';

// Create extraction directory
fs.mkdirSync(extractDir, { recursive: true });

// Extract the zip
execSync(`unzip -o "${zipFile}" -d "${extractDir}"`);

// List all extracted files recursively
function listFiles(dir, prefix = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      console.log(`[DIR] ${prefix}${item.name}/`);
      listFiles(fullPath, prefix + item.name + '/');
    } else {
      const stat = fs.statSync(fullPath);
      console.log(`[FILE] ${prefix}${item.name} (${stat.size} bytes)`);
    }
  }
}

console.log('Extracted contents:');
listFiles(extractDir);
