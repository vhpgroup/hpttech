const { execFileSync } = require("node:child_process");

const cwd = process.cwd();
const normalizedCwd = cwd.toLowerCase().replace(/\\/g, "/");

function listProcesses() {
  if (process.platform === "win32") {
    const command =
      "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | " +
      "Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress";
    const output = execFileSync("powershell.exe", ["-NoProfile", "-Command", command], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!output) return [];
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  const output = execFileSync("ps", ["-eo", "pid=,args="], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      return match ? { ProcessId: Number(match[1]), CommandLine: match[2] } : null;
    })
    .filter(Boolean);
}

function isThisProjectNextDev(processInfo) {
  if (Number(processInfo.ProcessId) === process.pid) return false;

  const commandLine = String(processInfo.CommandLine || "");
  const normalizedCommand = commandLine.toLowerCase().replace(/\\/g, "/");
  const isNextDev =
    normalizedCommand.includes("next") &&
    (normalizedCommand.includes(" dev") || normalizedCommand.includes("next/dist/bin/next"));

  return isNextDev && normalizedCommand.includes(normalizedCwd);
}

const runningDev = listProcesses().filter(isThisProjectNextDev);

if (runningDev.length) {
  console.error(
    [
      "Refusing to run `next build` while `next dev` is running for this project.",
      "Stop the local dev server first, then run the build again.",
      "This prevents .next dev CSS/chunks from being overwritten and causing broken localhost styling.",
    ].join("\n")
  );
  process.exit(1);
}
