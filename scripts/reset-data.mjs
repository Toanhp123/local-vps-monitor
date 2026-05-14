import fs from "node:fs";
import path from "node:path";

const dataFile = path.resolve(process.cwd(), process.env.DATA_FILE || "./data/monitor-state.json");
const state = {
  servers: {}
};

fs.mkdirSync(path.dirname(dataFile), { recursive: true });
fs.writeFileSync(dataFile, `${JSON.stringify(state, null, 2)}\n`);

console.log(`Reset monitor state at ${dataFile}`);
