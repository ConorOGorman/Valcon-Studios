import fs from "node:fs";
import { spawn, execSync } from "node:child_process";

function parseArgs(argv) {
  const args = { port: 3000, clean: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port") args.port = Number(argv[++i] ?? args.port);
    if (a === "--clean") args.clean = true;
  }
  return args;
}

function freePort(port) {
  if (process.platform === "win32") return;
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    const pids = out
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
    for (const pid of pids) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }

    // If anything is still holding the port after a short grace period, force kill.
    try {
      execSync("sleep 0.2");
      const still = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      })
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
      for (const pid of still) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {}
      }
    } catch {
      // Ignore.
    }
  } catch {
    // Port is likely free; ignore.
  }
}

function rmrfNext() {
  try {
    fs.rmSync(".next", { recursive: true, force: true });
  } catch (err) {
    // If cleanup fails, it's better to surface the issue than silently proceed with stale chunks.
    console.error("[dev-next] Failed to remove .next:", err);
  }
}

async function main() {
  const { port, clean } = parseArgs(process.argv);
  if (clean) rmrfNext();
  freePort(port);

  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "dev", "-p", String(port)],
    { stdio: "inherit", env: { ...process.env, NODE_ENV: "development" } },
  );

  child.on("exit", (code) => process.exit(code ?? 0));
}

await main();
