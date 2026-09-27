import { readFile } from "node:fs/promises";

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) throw new Error("Usage: node tools/performance/compare.mjs before.json after.json");
const before = JSON.parse(await readFile(beforePath, "utf8"));
const after = JSON.parse(await readFile(afterPath, "utf8"));
for (const field of ["platform", "arch", "cpu", "browser", "viewport", "ipc", "network", "runs"]) {
  if (before.environment[field] !== after.environment[field]) throw new Error(`Different ${field}; do not compare these runs`);
}
if (before.errors.length || after.errors.length) throw new Error("A run contains browser errors");
if (JSON.stringify(before.samples[0].fixture) !== JSON.stringify(after.samples[0].fixture)) throw new Error("Different scene fixtures");

const rows = [["Measurement", "Before", "After", "Reduction"]];
for (const [label, event, metric, unit, scale] of [
  ["Startup to frame", "startup", "readyMs", "ms", 1],
  ["Refresh to frame", "refresh", "readyMs", "ms", 1],
  ["Startup JavaScript", "startup", "jsBytes", "MB", 1e6],
  ["Startup long tasks (sum)", "startup", "longTaskMs", "ms", 1],
  ["First drawing page to frame", "firstDraw", "paintMs", "ms", 1],
  ["Drawing to home: dispatch", "leaveDraw", "stateReadyMs", "ms", 1],
  ["Drawing to home: frame", "leaveDraw", "paintMs", "ms", 1],
  ["Home to drawing: dispatch", "returnDraw", "stateReadyMs", "ms", 1],
  ["Home to drawing: frame", "returnDraw", "paintMs", "ms", 1],
]) {
  const a = before.summary[event][metric].median;
  const b = after.summary[event][metric].median;
  rows.push([label, `${(a / scale).toFixed(2)} ${unit}`, `${(b / scale).toFixed(2)} ${unit}`, `${((a - b) / a * 100).toFixed(1)}%`]);
}
const widths = rows[0].map((_, col) => Math.max(...rows.map((row) => row[col].length)));
const format = (row) => `| ${row.map((cell, col) => cell.padEnd(widths[col])).join(" | ")} |`;
console.log(format(rows[0]));
console.log(`|-${widths.map((w) => "-".repeat(w)).join("-|-")}-|`);
for (const row of rows.slice(1)) console.log(format(row));
