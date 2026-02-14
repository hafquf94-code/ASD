import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const zipUrl = 'https://v0chat-agent-data-prod.s3.us-east-1.amazonaws.com/vm-binary/YygQdDWKZAi/f8f20c25982a05909ea17ecff2051c42ca227bed451e27f125c9b15a05da7d21.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA52KF4VHQDTZ5RDMT%2F20260214%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260214T142331Z&X-Amz-Expires=3600&X-Amz-Signature=4404c57f427b99a30d4d190d609ad00ba4332c469ad47435f707728f20599fec&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject';
const zipPath = '/tmp/repo.zip';
const extractDir = '/tmp/extracted';

// Step 1: Download
console.log('Downloading ZIP...');
const response = await fetch(zipUrl);
if (!response.ok) {
  console.error('Download failed:', response.status, response.statusText);
  process.exit(1);
}
const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync(zipPath, buffer);
console.log('Downloaded ZIP:', buffer.length, 'bytes');

// Step 2: Extract
fs.mkdirSync(extractDir, { recursive: true });
const result = spawnSync('unzip', ['-o', zipPath, '-d', extractDir], {
  stdio: ['pipe', 'pipe', 'pipe']
});
if (result.status !== 0) {
  console.error('unzip failed:', result.stderr?.toString());
  process.exit(1);
}
console.log('Extraction successful!');

// Step 3: Find the root of the extracted content
// (ZIP might have a top-level folder)
let rootDir = extractDir;
const topItems = fs.readdirSync(extractDir);
if (topItems.length === 1) {
  const singleItem = path.join(extractDir, topItems[0]);
  if (fs.statSync(singleItem).isDirectory()) {
    rootDir = singleItem;
    console.log('Root directory:', topItems[0]);
  }
}

// Step 4: Collect all files
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.wav', '.ogg', '.webm',
  '.zip', '.gz', '.tar', '.rar',
  '.pdf', '.doc', '.docx',
  '.exe', '.dll', '.so', '.dylib',
  '.pyc', '.pyo', '.class',
  '.db', '.sqlite', '.sqlite3',
]);

function getAllFiles(dir, baseDir = dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      // Skip common non-essential directories
      if (['node_modules', '.git', '__pycache__', '.next', 'venv', 'env', '.venv'].includes(item.name)) continue;
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      results.push({
        relativePath: path.relative(baseDir, fullPath),
        fullPath,
        ext: path.extname(item.name).toLowerCase(),
        size: fs.statSync(fullPath).size,
      });
    }
  }
  return results;
}

const allFiles = getAllFiles(rootDir);
console.log(`\nTotal files found: ${allFiles.length}`);

// Step 5: Output file contents
const textFiles = [];
const binaryFiles = [];

for (const file of allFiles) {
  if (BINARY_EXTENSIONS.has(file.ext)) {
    binaryFiles.push(file);
  } else {
    textFiles.push(file);
  }
}

console.log(`Text files: ${textFiles.length}`);
console.log(`Binary files: ${binaryFiles.length}`);

// Print file listing first
console.log('\n===FILE_LIST_START===');
for (const file of allFiles) {
  const type = BINARY_EXTENSIONS.has(file.ext) ? 'BINARY' : 'TEXT';
  console.log(`${type}|${file.relativePath}|${file.size}`);
}
console.log('===FILE_LIST_END===');

// Print text file contents
for (const file of textFiles) {
  if (file.size > 100000) {
    console.log(`\n===FILE_START:${file.relativePath}===`);
    console.log('[SKIPPED - file too large: ' + file.size + ' bytes]');
    console.log(`===FILE_END:${file.relativePath}===`);
    continue;
  }
  try {
    const content = fs.readFileSync(file.fullPath, 'utf-8');
    console.log(`\n===FILE_START:${file.relativePath}===`);
    console.log(content);
    console.log(`===FILE_END:${file.relativePath}===`);
  } catch (e) {
    console.log(`\n===FILE_START:${file.relativePath}===`);
    console.log('[ERROR reading file: ' + e.message + ']');
    console.log(`===FILE_END:${file.relativePath}===`);
  }
}
