import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Download and extract
const zipUrl = 'https://v0-project-files.s3.us-east-1.amazonaws.com/ugc/e87fa20f-e8ca-4f66-a68a-e32f9beaef0b-joebek-auto-mart-pos%20%281%29.zip';
spawnSync('curl', ['-sL', '-o', '/tmp/repo.zip', zipUrl], { stdio: 'pipe', timeout: 60000 });
fs.mkdirSync('/tmp/extracted', { recursive: true });
spawnSync('unzip', ['-o', '/tmp/repo.zip', '-d', '/tmp/extracted'], { stdio: 'pipe' });

const topLevel = fs.readdirSync('/tmp/extracted');
const rootDir = topLevel.length === 1 && fs.statSync(path.join('/tmp/extracted', topLevel[0])).isDirectory()
  ? path.join('/tmp/extracted', topLevel[0]) : '/tmp/extracted';

// Files already written to project
const alreadyWritten = new Set([
  '.gitignore', 'app/admin/page.tsx', 'app/cart/page.tsx', 'app/globals.css',
  'app/investor/page.tsx', 'app/layout.tsx', 'app/page.tsx', 'app/pos/page.tsx',
  'app/product/[id]/page.tsx', 'app/shop/page.tsx', 'components.json',
  'next.config.mjs', 'package.json', 'postcss.config.mjs', 'tsconfig.json',
  'pnpm-lock.yaml', // skip lockfile
]);

// Skip UI components (already in project defaults) and binary files
const skipPatterns = [
  /^components\/ui\//, // skip shadcn UI components
  /^hooks\//, // skip hooks
  /^styles\//, // skip duplicate styles
];

const textExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.mjs', '.html', '.md', '.yaml', '.yml', '.svg']);

// Collect remaining text files
const remaining = [];
function walk(dir, rel = '') {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    const relPath = rel ? `${rel}/${item.name}` : item.name;
    if (item.isDirectory()) {
      if (['node_modules', '.git', '.next'].includes(item.name)) continue;
      walk(fullPath, relPath);
    } else {
      if (alreadyWritten.has(relPath)) continue;
      if (skipPatterns.some(p => p.test(relPath))) continue;
      const ext = path.extname(item.name).toLowerCase();
      if (!textExts.has(ext) && item.name !== '.gitignore') continue;
      remaining.push({ fullPath, relPath });
    }
  }
}
walk(rootDir);
remaining.sort((a, b) => a.relPath.localeCompare(b.relPath));

console.log(`Remaining text files to write: ${remaining.length}`);
console.log('');

// Output each file
for (const { fullPath, relPath } of remaining) {
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log(`===FILE:${relPath}===`);
    console.log(content);
    console.log(`===END:${relPath}===`);
  } catch (e) {
    console.error(`Error reading ${relPath}: ${e.message}`);
  }
}

// Also output binary file listing for images
console.log('\n===BINARY_FILES===');
const binaryExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.svg']);
function walkBinary(dir, rel = '') {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    const relPath = rel ? `${rel}/${item.name}` : item.name;
    if (item.isDirectory()) {
      if (['node_modules', '.git', '.next'].includes(item.name)) continue;
      walkBinary(fullPath, relPath);
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (binaryExts.has(ext) && !textExts.has(ext)) {
        const stat = fs.statSync(fullPath);
        console.log(`BINARY:${relPath}:${stat.size}`);
      }
    }
  }
}
walkBinary(rootDir);
