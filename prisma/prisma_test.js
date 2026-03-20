const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx prisma generate', { encoding: 'utf-8' });
  fs.writeFileSync('prisma_stdout.log', out);
} catch (err) {
  fs.writeFileSync('prisma_stdout.log', err.stdout || "");
  fs.writeFileSync('prisma_stderr.log', err.stderr || "");
}
