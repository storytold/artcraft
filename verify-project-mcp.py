"""Verify the local project MCP configuration without a model or any upload."""
import argparse
import hashlib
import json
import pathlib
import queue
import subprocess
import threading
import time
import tomllib

root = pathlib.Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--image', type=pathlib.Path, help='Optional approved PNG/JPEG to inspect; never uploaded')
args = parser.parse_args()
config = tomllib.loads((root / '.codex/config.toml').read_text())
server = config['mcp_servers']['artcraft_image_bridge']
process = subprocess.Popen(
    [server['command'], *server['args']], cwd=server['cwd'],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    text=True, encoding='utf-8',
)
messages = queue.Queue()


def read_messages():
    for line in process.stdout:
        try:
            messages.put(json.loads(line))
        except json.JSONDecodeError:
            messages.put({'protocol_error': True})


def send(message):
    process.stdin.write(json.dumps(message) + '\n')
    process.stdin.flush()


def request(identifier, method, params=None):
    send({'jsonrpc': '2.0', 'id': identifier, 'method': method, 'params': params or {}})
    deadline = time.monotonic() + 35
    while True:
        message = messages.get(timeout=max(0.01, deadline - time.monotonic()))
        if message.get('protocol_error'):
            raise RuntimeError('Unexpected non-protocol output')
        if message.get('id') == identifier:
            if 'error' in message:
                raise RuntimeError('MCP request failed')
            return message['result']


threading.Thread(target=read_messages, daemon=True).start()
try:
    request(1, 'initialize', {
        'protocolVersion': '2025-06-18', 'capabilities': {},
        'clientInfo': {'name': 'project-config-verifier', 'version': '0.1'},
    })
    send({'jsonrpc': '2.0', 'method': 'notifications/initialized'})
    tools = request(2, 'tools/list')['tools']
    assert {tool['name'] for tool in tools} == {
        'artcraft_inspect_local_image', 'artcraft_import_local_image', 'artcraft_get_import'}
    if args.image:
        path = args.image.resolve(strict=True)
        inspected = request(3, 'tools/call', {
            'name': 'artcraft_inspect_local_image', 'arguments': {'path': str(path)},
        })
        assert not inspected.get('isError', False), 'Image inspection failed'
        image = json.loads(inspected['content'][0]['text'])
        assert image['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()
        assert image['byte_size'] == path.stat().st_size
        assert image['width'] > 0 and image['height'] > 0
    print(json.dumps({'configured_server': 'passed', 'tool_count': len(tools),
                      'inspection': 'passed' if args.image else 'not requested',
                      'uploads': 0, 'model_calls': 0}))
finally:
    process.terminate()
    process.wait(timeout=10)
