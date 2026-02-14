import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const extractDir = '/tmp/extracted';
const zipPath = '/tmp/repo.zip';

// Download ZIP
console.log('Downloading...');
const dl = spawnSync('curl', ['-sL', '-o', zipPath, 'https://v0-project-files.storage.googleapis.com/c/A0953c52-dc22-4e4e-8ad2-0e2ba65c9d8e/joebek-auto-mart-pos%20(1).zip'], { timeout: 60000 });
if (!fs.existsSync(zipPath)) {
  console.error('Download failed');
  process.exit(1);
}

// Extract
fs.mkdirSync(extractDir, { recursive: true });
spawnSync('unzip', ['-o', zipPath, '-d', extractDir]);

// Find root
let root = extractDir;
const entries = fs.readdirSync(root);
if (entries.length === 1) {
  const sub = path.join(root, entries[0]);
  if (fs.statSync(sub).isDirectory()) root = sub;
}

// Collect ALL files
function collectFiles(dir, base = '') {
  const results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${item.name}` : item.name;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...collectFiles(full, rel));
    } else {
      results.push({ rel, full });
    }
  }
  return results;
}

const files = collectFiles(root);

// Output text files batch 1 (app/, lib/, styles/, root config files)
const textExts = new Set(['.tsx', '.ts', '.css', '.js', '.mjs', '.json', '.yaml', '.yml', '.md', '.gitignore', '.svg']);

for (const f of files) {
  const ext = path.extname(f.rel).toLowerCase();
  const basename = path.basename(f.rel);
  const isText = textExts.has(ext) || basename === '.gitignore' || basename === 'pnpm-lock.yaml';
  
  // Only output non-UI component text files in this batch
  if (isText && !f.rel.startsWith('components/ui/')) {
    const content = fs.readFileSync(f.full, 'utf-8');
    console.log(`===WRITE:${f.rel}===`);
    console.log(content);
    console.log(`===END:${f.rel}===`);
  }
}

console.log('BATCH1_COMPLETE');
