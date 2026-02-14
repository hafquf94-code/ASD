import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const zipUrl = 'https://v0-project-files.s3.us-east-1.amazonaws.com/s_b89af90a-d765-41f2-b879-e06e3b28e5e5/joebek-auto-mart-pos%20%281%29.zip';
const extractDir = '/tmp/extracted';
const projectDir = '/home/user';

// Clean and create extraction directory
if (fs.existsSync(extractDir)) {
  fs.rmSync(extractDir, { recursive: true });
}
fs.mkdirSync(extractDir, { recursive: true });

// Download the ZIP
console.log('Downloading ZIP...');
const curlResult = spawnSync('curl', ['-sL', '-o', '/tmp/repo.zip', zipUrl], { stdio: ['pipe', 'pipe', 'pipe'] });
if (curlResult.status !== 0) {
  console.error('Download failed:', curlResult.stderr?.toString());
  process.exit(1);
}
console.log('Downloaded successfully');

// Extract the ZIP
const unzipResult = spawnSync('unzip', ['-o', '/tmp/repo.zip', '-d', extractDir], { stdio: ['pipe', 'pipe', 'pipe'] });
if (unzipResult.status !== 0) {
  console.error('Extraction failed:', unzipResult.stderr?.toString());
  process.exit(1);
}
console.log('Extracted successfully');

// Find the root directory inside the extracted zip
const extractedItems = fs.readdirSync(extractDir);
let sourceDir = extractDir;
// If there's a single directory inside, use that as the source
if (extractedItems.length === 1) {
  const singleItem = path.join(extractDir, extractedItems[0]);
  if (fs.statSync(singleItem).isDirectory()) {
    sourceDir = singleItem;
  }
}
console.log('Source directory:', sourceDir);

// Copy all files recursively
function copyRecursive(src, dest) {
  const items = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;
  
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    
    // Skip node_modules, .next, .git
    if (['node_modules', '.next', '.git'].includes(item.name)) continue;
    
    if (item.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      count += copyRecursive(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

const fileCount = copyRecursive(sourceDir, projectDir);
console.log(`Copied ${fileCount} files to project directory`);

// List what was copied
function listFiles(dir, prefix = '', results = []) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (['node_modules', '.next', '.git', 'scripts'].includes(item.name)) continue;
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        listFiles(fullPath, prefix + item.name + '/', results);
      } else {
        results.push(prefix + item.name);
      }
    }
  } catch (e) {
    // skip
  }
  return results;
}

const files = listFiles(projectDir);
console.log(`\nProject now contains ${files.length} files:`);
files.forEach(f => console.log('  ' + f));
