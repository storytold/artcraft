const fs = require('node:fs');

const version = process.argv[2];
const configPaths = [
  'crates/desktop/artcraft/tauri.conf.json',
  'crates/desktop/artcraft/tauri-mac.conf.json',
];
const versionSourcePath = 'crates/desktop/artcraft/src/version.rs';

const semanticVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (!version || !semanticVersionPattern.test(version)) {
  throw new Error(`Invalid semantic-release version: ${version || '<missing>'}`);
}

for (const configPath of configPaths) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.version = version;
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

const versionSource = fs.readFileSync(versionSourcePath, 'utf8');
const updatedVersionSource = versionSource.replace(
  /(ARTCRAFT_VERSION:\s*&str\s*=\s*")[^"]+(";)/,
  `$1${version}$2`,
);

if (updatedVersionSource === versionSource && !versionSource.includes(`"${version}"`)) {
  throw new Error(`Could not update ARTCRAFT_VERSION in ${versionSourcePath}`);
}

fs.writeFileSync(versionSourcePath, updatedVersionSource);
