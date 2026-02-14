import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Download the ZIP
const zipUrl = 'https://v0-project-files.s3.us-east-1.amazonaws.com/ugc/e87fa20f-e8ca-4f66-a68a-e32f9beaef0b-joebek-auto-mart-pos%20%281%29.zip';
console.log('Downloading ZIP...');
const dlResult = spawnSync('curl', ['-L', '-o', '/tmp/repo.zip', zipUrl], { stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
if (dlResult.status !== 0) { console.error('Download failed'); process.exit(1); }

// Extract
const extractDir = '/tmp/extracted';
fs.mkdirSync(extractDir, { recursive: true });
spawnSync('unzip', ['-o', '/tmp/repo.zip', '-d', extractDir], { stdio: ['pipe', 'pipe', 'pipe'] });

// Find root
const topLevel = fs.readdirSync(extractDir);
const rootDir = topLevel.length === 1 && fs.statSync(path.join(extractDir, topLevel[0])).isDirectory()
  ? path.join(extractDir, topLevel[0]) : extractDir;

// Target project dir - write files directly using the script's fs access
const projectDir = '/home/user/project-files';
fs.mkdirSync(projectDir, { recursive: true });

// Walk and copy all files  
let fileCount = 0;
let errorCount = 0;

function copyRecursive(srcDir, relPath = '') {
  for (const item of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, item.name);
    const itemRelPath = relPath ? `${relPath}/${item.name}` : item.name;
    
    if (item.isDirectory()) {
      // Skip node_modules, .git, .next
      if (['node_modules', '.git', '.next'].includes(item.name)) continue;
      copyRecursive(srcPath, itemRelPath);
    } else {
      const destPath = path.join(projectDir, itemRelPath);
      try {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        fileCount++;
      } catch (e) {
        console.error(`Error copying ${itemRelPath}: ${e.message}`);
        errorCount++;
      }
    }
  }
}

copyRecursive(rootDir);
console.log(`Copied ${fileCount} files to ${projectDir} (${errorCount} errors)`);

// Now list all files with their base64 content for binary files
// and plain text content for text files
function listAll(dir, relPath = '') {
  const results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    const itemRelPath = relPath ? `${relPath}/${item.name}` : item.name;
    if (item.isDirectory()) {
      results.push(...listAll(fullPath, itemRelPath));
    } else {
      results.push(itemRelPath);
    }
  }
  return results;
}

const allFiles = listAll(projectDir);
console.log(`\nAll files (${allFiles.length}):`);
allFiles.forEach(f => console.log(`  ${f}`));

// Output a manifest JSON with file paths and sizes
const manifest = allFiles.map(f => {
  const fullPath = path.join(projectDir, f);
  const stat = fs.statSync(fullPath);
  return { path: f, size: stat.size };
});

console.log('\n===MANIFEST_START===');
console.log(JSON.stringify(manifest, null, 2));
console.log('===MANIFEST_END===');
