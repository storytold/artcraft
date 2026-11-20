import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "apps", "artcraft", "tsconfig.json");
const galleryPath = join(
  root,
  "libs",
  "components",
  "gallery-modal",
  "src",
  "lib",
  "gallery-modal.tsx",
);
const topBarPath = join(
  root,
  "apps",
  "artcraft",
  "app",
  "src",
  "components",
  "signaled",
  "TopBar",
  "TopBar.tsx",
);
const normalizePath = (value) =>
  resolve(value).split(sep).join("/").toLowerCase();
const sourceRoots = [
  join(root, "apps", "artcraft", "app"),
  join(root, "libs", "components", "gallery-modal"),
].map((path) => normalizePath(path) + "/");
const selfTest = process.argv.includes("--self-test");

const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
if (error) {
  throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
}
const parsed = ts.parseJsonConfigFileContent(
  config,
  ts.sys,
  dirname(configPath),
);
if (parsed.errors.length > 0) {
  throw new Error(
    parsed.errors
      .map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n"))
      .join("\n"),
  );
}

const host = ts.createCompilerHost(parsed.options);
if (selfTest) {
  const readFile = host.readFile.bind(host);
  host.readFile = (filename) => {
    const source = readFile(filename);
    return source !== undefined &&
      normalizePath(filename) === normalizePath(topBarPath)
      ? `${source}\nvoid __artcraft_probe_missing__;`
      : source;
  };
}

const program = ts.createProgram({
  rootNames: [...parsed.fileNames, galleryPath],
  options: parsed.options,
  projectReferences: parsed.projectReferences,
  host,
});
const unbound = ts
  .getPreEmitDiagnostics(program)
  .filter(
    (item) =>
      (item.code === 2304 || item.code === 2552) &&
      item.file &&
      sourceRoots.some((sourceRoot) =>
        normalizePath(item.file.fileName).startsWith(sourceRoot),
      ),
  );

if (selfTest) {
  if (
    !unbound.some((item) =>
      ts
        .flattenDiagnosticMessageText(item.messageText, " ")
        .includes("__artcraft_probe_missing__"),
    )
  ) {
    throw new Error(
      "The runtime binding check did not catch a missing identifier",
    );
  }
  console.log("Runtime binding check self-test passed");
} else if (unbound.length > 0) {
  for (const item of unbound) {
    const { line } = item.file.getLineAndCharacterOfPosition(item.start);
    console.error(
      `${item.file.fileName}:${line + 1}: TS${item.code} ${ts.flattenDiagnosticMessageText(item.messageText, " ")}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    "ArtCraft runtime bindings verified (full typecheck is separate)",
  );
}
