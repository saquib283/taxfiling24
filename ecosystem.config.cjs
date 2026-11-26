const fs = require("fs");
const path = require("path");

function readPortFromEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/^\s*PORT\s*=\s*["']?(\d{2,5})["']?\s*$/m);
    if (match) return Number(match[1]);
  } catch {
    // Fall back to process.env.PORT or 3000 when .env does not specify PORT
  }
  return Number(process.env.PORT || 3000);
}

const appDir = __dirname;
const port = readPortFromEnvFile(path.join(appDir, ".env"));

module.exports = {
  apps: [
    {
      name: "taxfiling24",
      cwd: appDir,
      script: "node_modules/next/dist/bin/next",
      args: `start -H 127.0.0.1 -p ${port}`,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: String(port),
      },
    },
  ],
};

