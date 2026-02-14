import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

// First, let's check the actual ZIP file from the project
// The scripts can access files that are written to the project
// Let's try reading the zip file that was downloaded

const zipPath = '/tmp/repo.zip';

// Download the file first
const zipUrl = process.env.ZIP_URL;

async function main() {
  // Try fetching the actual file from the blob storage
  // First let's see what files exist in the script's accessible directories
  console.log('Checking /tmp contents:');
  try {
    console.log(fs.readdirSync('/tmp'));
  } catch(e) { console.log('Cannot read /tmp:', e.message); }
  
  console.log('\nChecking home dir:');
  try {
    console.log(fs.readdirSync('/home/user'));
  } catch(e) { console.log('Cannot read home:', e.message); }

  // The issue is likely that fetch returns HTML instead of the actual binary
  // Let's try using the file: protocol or a different approach
  // Let's check if we can use wget/curl with the actual file
  
  // Try to find the zip in the home directory
  function findZips(dir) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isFile() && item.name.endsWith('.zip')) {
          console.log('Found ZIP:', full, 'Size:', fs.statSync(full).size);
          // Check first 4 bytes (PK magic number for ZIP is 0x504B0304)
          const buf = Buffer.alloc(4);
          const fd = fs.openSync(full, 'r');
          fs.readSync(fd, buf, 0, 4, 0);
          fs.closeSync(fd);
          console.log('First 4 bytes:', buf.toString('hex'), '(PK = 504b0304)');
        }
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          findZips(full);
        }
      }
    } catch(e) { /* skip */ }
  }
  
  findZips('/home/user');
  
  // Let's also check if the project files are symlinked somewhere
  console.log('\nChecking if project dir is accessible:');
  try {
    const files = fs.readdirSync('/vercel/share/v0-project');
    console.log('Project files:', files.slice(0, 20));
  } catch(e) {
    console.log('Cannot access project dir:', e.message);
  }
  
  // Try to use the blob URL approach differently - use curl
  console.log('\nTrying curl approach...');
  const curlResult = spawnSync('which', ['curl']);
  console.log('curl available:', curlResult.stdout?.toString().trim());
  
  const wgetResult = spawnSync('which', ['wget']);
  console.log('wget available:', wgetResult.stdout?.toString().trim());
  
  // Check file command
  const fileResult = spawnSync('which', ['file']);
  console.log('file command available:', fileResult.stdout?.toString().trim());
}

main();
