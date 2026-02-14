import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const zipUrl = process.env.ZIP_URL || 'https://v0-project-files.s3.us-east-1.amazonaws.com/ugc/e87fa20f-e8ca-4f66-a68a-e32f9beaef0b-joebek-auto-mart-pos%20%281%29.zip';
const extractDir = '/tmp/extracted';
const batchNum = parseInt(process.env.BATCH || '1');

// Download
const dlResult = spawnSync('curl', ['-L', '-o', '/tmp/repo.zip', zipUrl], { stdio: ['pipe', 'pipe', 'pipe'] });
if (dlResult.status !== 0) { console.error('Download failed'); process.exit(1); }

// Extract
fs.mkdirSync(extractDir, { recursive: true });
spawnSync('unzip', ['-o', '/tmp/repo.zip', '-d', extractDir], { stdio: ['pipe', 'pipe', 'pipe'] });

// Find root dir
const topLevel = fs.readdirSync(extractDir);
const rootDir = topLevel.length === 1 && fs.statSync(path.join(extractDir, topLevel[0])).isDirectory()
  ? path.join(extractDir, topLevel[0])
  : extractDir;

// Collect all text files
const textFiles = [];
function walk(dir, rel = '') {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    const relPath = rel ? `${rel}/${item.name}` : item.name;
    if (item.isDirectory()) {
      walk(fullPath, relPath);
    } else {
      const ext = path.extname(item.name).toLowerCase();
      const textExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.mjs', '.html', '.md', '.yaml', '.yml', '.gitignore', '.svg', '.env', '.txt'];
      if (textExts.includes(ext) || item.name === '.gitignore' || item.name === 'pnpm-lock.yaml') {
        textFiles.push({ fullPath, relPath });
      }
    }
  }
}
walk(rootDir);

// Sort by path
textFiles.sort((a, b) => a.relPath.localeCompare(b.relPath));

// Batch: each batch outputs ~20 files
const batchSize = 20;
const start = (batchNum - 1) * batchSize;
const end = Math.min(start + batchSize, textFiles.length);

console.log(`Total text files: ${textFiles.length}`);
console.log(`Batch ${batchNum}: files ${start + 1} to ${end}`);
console.log(`Total batches needed: ${Math.ceil(textFiles.length / batchSize)}`);
console.log('');

for (let i = start; i < end; i++) {
  const { fullPath, relPath } = textFiles[i];
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log(`===FILE_START:${relPath}===`);
    console.log(content);
    console.log(`===FILE_END:${relPath}===`);
    console.log('');
  } catch (e) {
    console.log(`===FILE_ERROR:${relPath}===${e.message}`);
  }
}
