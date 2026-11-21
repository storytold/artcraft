import contextlib
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import bump_artcraft_desktop_version as bump


class BumpDesktopVersionTest(unittest.TestCase):
    def test_explicit_version_can_be_retried(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            version_rs = root / "version.rs"
            tauri_conf = root / "tauri.conf.json"
            tauri_mac = root / "tauri-mac.conf.json"
            version_rs.write_text('pub const ARTCRAFT_VERSION: &str = "1.2.3";\n')
            tauri_conf.write_text('{"version": "1.2.2"}\n')
            tauri_mac.write_text('{"version": "1.2.2"}\n')

            with (
                patch.multiple(bump, VERSION_RS=version_rs, TAURI_CONF=tauri_conf, TAURI_MAC=tauri_mac),
                patch.object(bump.sys, "argv", ["bump_artcraft_desktop_version.py", "1.2.3"]),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                bump.main()
                bump.main()

            self.assertEqual(bump.read_version_rs(version_rs), "1.2.3")
            self.assertEqual(bump.read_json_version(tauri_conf), "1.2.3")
            self.assertEqual(bump.read_json_version(tauri_mac), "1.2.3")


if __name__ == "__main__":
    unittest.main()
