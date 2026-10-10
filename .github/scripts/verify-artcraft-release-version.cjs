const fs = require('node:fs');

const expectedVersion = process.argv[2];
const tauriConfigPaths = [
  'crates/desktop/artcraft/tauri.conf.json',
  'crates/desktop/artcraft/tauri-mac.conf.json',
];
const versionSourcePath = 'crates/desktop/artcraft/src/version.rs';

if (!expectedVersion) {
  throw new Error('Expected semantic-release to provide the next version');
}

for (const configPath of tauriConfigPaths) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assertVersion(configPath, config.version);
}

const versionSource = fs.readFileSync(versionSourcePath, 'utf8');
const versionMatch = versionSource.match(
  /ARTCRAFT_VERSION:\s*&str\s*=\s*"([^"]+)"/,
);

if (!versionMatch) {
  throw new Error(`Could not read ARTCRAFT_VERSION from ${versionSourcePath}`);
}

assertVersion(versionSourcePath, versionMatch[1]);

function assertVersion(source, actualVersion) {
  if (actualVersion !== expectedVersion) {
    throw new Error(
      `${source} has version ${actualVersion}; expected ${expectedVersion}`,
    );
  }
}
