import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const ensureDefaultEnv = () => {
  if (!process.env.VITE_API_URL) {
    process.env.VITE_API_URL = "http://localhost:8000/api";
  }
  if (!process.env.VITE_BACKEND_ORIGIN) {
    process.env.VITE_BACKEND_ORIGIN = "http://localhost:8000";
  }
};

const resolvePrimaryCommand = (commandArgs) => {
  const arg = commandArgs.find((value) => !value.startsWith("-"));
  return arg ?? "serve";
};

const main = async () => {
  const [command = "vite", ...commandArgs] = process.argv.slice(2);
  const primaryCommand = resolvePrimaryCommand(commandArgs);
  const isDevCommand = primaryCommand === "serve" || primaryCommand === "dev";

  if (isDevCommand) {
    ensureDefaultEnv();
  }

  if (command !== "vite") {
    throw new Error(
      `Unsupported command "${command}". Use the npm scripts to run Vite.`
    );
  }

  const require = createRequire(import.meta.url);
  const vitePackagePath = require.resolve("vite/package.json");
  const viteBin = join(dirname(vitePackagePath), "bin", "vite.js");

  const child = spawn(process.execPath, [viteBin, ...commandArgs], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
