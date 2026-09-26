import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

process.env.GOMAXPROCS ??= "2";

const viteCli = resolve("node_modules/vite/bin/vite.js");
const result = spawnSync(process.execPath, [viteCli, "build"], {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
