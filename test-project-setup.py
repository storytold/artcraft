"""Exercise setup in isolated folders; no credentials, uploads, or Codex changes."""
import os
import pathlib
import shutil
import subprocess
import tempfile
import tomllib

root = pathlib.Path(__file__).resolve().parent
shell = pathlib.Path(os.environ['SystemRoot']) / 'System32/WindowsPowerShell/v1.0/powershell.exe'
(root / '.build').mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix="setup test ' ", dir=root / '.build') as temporary:
    project = pathlib.Path(temporary)
    assert project.resolve().is_relative_to((root / '.build').resolve())
    script = project / 'setup-project-mcp.ps1'
    shutil.copyfile(root / script.name, script)
    binary = project / '.build/bridge-target/debug/artcraft-image-bridge.exe'
    binary.parent.mkdir(parents=True)
    binary.write_bytes(b'not executed: installer fixture')
    config = project / '.codex/config.toml'
    config.parent.mkdir()
    unrelated = '[mcp_servers.existing]\ncommand = "keep-me"\n'
    config.write_text(unrelated, encoding='utf-8')

    def run(mode, succeeds=True):
        result = subprocess.run([str(shell), '-NoProfile', '-NonInteractive', '-File', str(script),
                                 '-Mode', mode], capture_output=True, text=True, timeout=30)
        assert (result.returncode == 0) == succeeds, result.stderr

    run('Live', succeeds=False)
    assert config.read_text() == unrelated, 'Missing credentials changed config'
    run('Inspect')
    first = config.read_bytes()
    parsed = tomllib.loads(first.decode('utf-8'))
    server = parsed['mcp_servers']['artcraft_image_bridge']
    assert parsed['mcp_servers']['existing']['command'] == 'keep-me'
    assert server['cwd'] == str(project)
    assert len(server['args']) == 2
    assert pathlib.Path(server['command']).read_bytes() == binary.read_bytes()
    run('Inspect')
    assert config.read_bytes() == first, 'Repeated setup should be stable'
    run('Mock')
    mock = tomllib.loads(config.read_text())['mcp_servers']['artcraft_image_bridge']
    assert mock['args'][-1] == '--mock'
    assert mock['args'][1].endswith('codex-mock-state')
    binary.write_bytes(b'new executable fixture')
    run('Inspect')
    installed = tomllib.loads(config.read_text())['mcp_servers']['artcraft_image_bridge']
    assert installed['command'] != server['command']
    assert pathlib.Path(server['command']).exists(), 'Old running copy must be preserved'
    assert list((project / '.build/config-backups').glob('config.toml.*.bak')), 'Existing config needs a backup'
    config.write_text(unrelated + '[mcp_servers.artcraft_image_bridge]\ncommand = "custom"\n')
    prior = config.read_bytes()
    run('Inspect', succeeds=False)
    assert config.read_bytes() == prior, 'Unmanaged entry was overwritten'
print('Project setup tests passed: portable paths, preservation, refusal, modes, stable installs.')
