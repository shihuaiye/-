import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const envPath = path.join(serverRoot, ".env");

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
