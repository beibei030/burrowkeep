import { spawn } from "node:child_process";

const child = spawn(
  "C:\\caddy\\caddy.exe",
  ["run", "--config", "C:\\caddy\\Caddyfile.burrowkeep"],
  { stdio: "inherit" },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
