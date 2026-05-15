import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");
const serverEntry = path.join(rootDir, "dist", "server", "index.js");
const clientIndex = path.join(rootDir, "dist", "client", "index.html");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (file, args) => {
  const result = spawnSync(file, args, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
    windowsHide: true
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
};

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log("Created .env from .env.example");
}

if (!fs.existsSync(serverEntry) || !fs.existsSync(clientIndex)) {
  console.log("Build output not found. Running npm run build...");
  run(npmCommand, ["run", "build"]);
}

run(process.execPath, [serverEntry]);
