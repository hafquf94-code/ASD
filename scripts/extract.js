import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const zipUrl = 'https://v0chat-agent-data-prod.s3.us-east-1.amazonaws.com/vm-binary/YygQdDWKZAi/f8f20c25982a05909ea17ecff2051c42ca227bed451e27f125c9b15a05da7d21.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA52KF4VHQDTZ5RDMT%2F20260214%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260214T142331Z&X-Amz-Expires=3600&X-Amz-Signature=4404c57f427b99a30d4d190d609ad00ba4332c469ad47435f707728f20599fec&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject';
const zipPath = '/tmp/repo.zip';
const extractDir = '/tmp/extracted';

// Download the zip file
console.log('Downloading ZIP...');
const response = await fetch(zipUrl);
if (!response.ok) {
  console.error('Download failed:', response.status, response.statusText);
  process.exit(1);
}
const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync(zipPath, buffer);
console.log('Downloaded ZIP:', buffer.length, 'bytes');

// Create extraction directory
fs.mkdirSync(extractDir, { recursive: true });

// Extract
const result = spawnSync('unzip', ['-o', zipPath, '-d', extractDir], {
  stdio: ['pipe', 'pipe', 'pipe']
});

if (result.status !== 0) {
  console.error('unzip stderr:', result.stderr?.toString());
  process.exit(1);
}

console.log('Extraction successful!');

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

console.log('\nExtracted contents:');
listFiles(extractDir);
