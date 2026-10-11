'use strict';

const fs = require('node:fs');

const releaseTag = process.argv[2];
const releaseTagPattern = /^artcraft-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const versionConfigPaths = [
  'crates/desktop/artcraft/tauri.conf.json',
  'crates/desktop/artcraft/tauri-mac.conf.json',
];
const versionSourcePath = 'crates/desktop/artcraft/src/version.rs';

const tagMatch = releaseTagPattern.exec(releaseTag ?? '');
if (!tagMatch) {
  throw new Error(
    'Release tag must use the strict semantic-version format artcraft-vX.Y.Z',
  );
}

const expectedVersion = releaseTag.slice('artcraft-v'.length);

for (const configPath of versionConfigPaths) {
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
process.stdout.write(expectedVersion);

function assertVersion(source, actualVersion) {
  if (actualVersion !== expectedVersion) {
    throw new Error(
      `${source} has version ${actualVersion}; expected ${expectedVersion}`,
    );
  }
}
