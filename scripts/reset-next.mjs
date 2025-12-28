import fs from "node:fs";
import { execSync } from "node:child_process";

function rmrf(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {}
}

function killPort(port) {
  if (process.platform === "win32") return;
  try {
    const pids = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    })
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));

    for (const pid of pids) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {}
    }
  } catch {}
}

killPort(3000);
rmrf(".next");
rmrf(".turbo");
rmrf("node_modules/.cache");

console.log("Reset complete: removed .next/.turbo/cache and freed port 3000.");

