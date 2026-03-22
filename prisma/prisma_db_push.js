const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Running prisma db push...');
  const out = execSync('npx prisma db push', { encoding: 'utf-8' });
  fs.writeFileSync('prisma_push_stdout.log', out);
  console.log('Success!');
} catch (err) {
  console.error('Failed prisma db push');
  fs.writeFileSync('prisma_push_stdout.log', err.stdout || "");
  fs.writeFileSync('prisma_push_stderr.log', err.stderr || "");
}
