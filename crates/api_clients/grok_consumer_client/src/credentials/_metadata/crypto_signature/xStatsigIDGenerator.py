#!/usr/bin/env python3
# From https://github.com/kbtit25/grok2api/blob/73c917b15438e12699531ccf9411d3a7d1110cbf/xStatsigIDGenerator.py
# -*- coding: utf-8 -*-

import base64
import struct
import hashlib
import time
import secrets
import requests
import re
import json
from typing import Optional, Dict, Any

class XStatsigIDGenerator:
    """x-statsig-id 生成器"""

    def __init__(self):
        self.base_timestamp = int(time.time())  # 使用当前系统时间
        self.grok_url = "https://grok.com"

    def get_grok_meta_content(self) -> bytes:
        """
        从 grok.com 获取 meta 标签中的 grok-site-verification 内容
        使用多种方法彻底解决403问题

        Returns:
            48字节的meta内容
        """
        print("🌐 正在请求 grok.com...")

        # 定义多种绕过策略
        strategies = [
            #self._try_curl_with_proxy,
            self._try_curl_with_different_ua,
            #self._try_requests_with_session,
            #self._try_curl_cffi_advanced,
            #self._try_alternative_endpoints,
            #self._try_cached_content
        ]

        for i, strategy in enumerate(strategies):
            try:
                print(f"   尝试策略 {i+1}: {strategy.__name__}")
                result = strategy()
                if result:
                    return result
            except Exception as e:
                print(f"   策略 {i+1} 失败: {e}")
                continue

        # 所有策略都失败，使用备用内容
        print("   ❌ 所有策略都失败，使用备用meta内容")
        fallback = b"backup-grok-meta-content-when-request-fails-ok"
        return fallback + b'\x00' * (48 - len(fallback))

    def _try_curl_with_proxy(self) -> bytes:
        """策略1: 使用curl + 代理"""
        import subprocess

        # 尝试多个公共代理
        proxies = [
            None,  # 无代理
            "socks5://127.0.0.1:1080",  # 本地代理
            "http://127.0.0.1:8080",   # 本地HTTP代理
        ]

        for proxy in proxies:
            try:
                curl_command = [
                    'curl', '-s', '-L', '--max-time', '15',
                    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    '--header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    '--header', 'Accept-Language: en-US,en;q=0.5',
                    '--header', 'Accept-Encoding: gzip, deflate',
                    '--header', 'Connection: keep-alive',
                    '--header', 'Upgrade-Insecure-Requests: 1',
                    '--compressed'
                ]

                if proxy:
                    curl_command.extend(['--proxy', proxy])

                curl_command.append(self.grok_url)

                result = subprocess.run(curl_command, capture_output=True, text=True, timeout=15)

                if result.returncode == 0 and len(result.stdout) > 1000:
                    print(f"      ✅ curl成功 (代理: {proxy or '无'})")
                    return self._extract_meta_from_html(result.stdout)

            except Exception:
                continue

        return None

    def _try_curl_with_different_ua(self) -> bytes:
        """策略2: 使用不同的User-Agent"""
        import subprocess

        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0',
            #'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            #'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/119.0',
            #'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            #'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ]

        for ua in user_agents:
            try:
                curl_command = [
                    'curl-impersonate-ff', '-s', '-L', '--max-time', '10',
                    '--user-agent', ua,
                    '--header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    '--header', 'Accept-Language: en-US,en;q=0.9',
                    '--header', 'Cache-Control: no-cache',
                    '--header', 'Pragma: no-cache',
                    '--compressed',
                    self.grok_url
                ]

                result = subprocess.run(curl_command, capture_output=True, text=True, timeout=10)

                if result.returncode == 0 and len(result.stdout) > 1000:
                    print(f"      ✅ 不同UA成功")
                    return self._extract_meta_from_html(result.stdout)

            except Exception:
                continue

        return None

    def _try_requests_with_session(self) -> bytes:
        """策略3: 使用requests session模拟真实浏览器行为"""
        import requests
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry

        session = requests.Session()

        # 配置重试策略
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        # 模拟真实浏览器行为
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        }

        try:
            # 先访问主页建立session
            session.get('https://x.com', headers=headers, timeout=5)

            # 再访问grok
            response = session.get(self.grok_url, headers=headers, timeout=10)

            if response.status_code == 200 and len(response.text) > 1000:
                print(f"      ✅ session请求成功")
                return self._extract_meta_from_html(response.text)

        except Exception:
            pass

        return None

    def _try_curl_cffi_advanced(self) -> bytes:
        """策略4: 使用curl_cffi高级模拟"""
        try:
            from curl_cffi import requests as curl_requests

            # 尝试不同的浏览器模拟
            impersonations = ['chrome120', 'chrome119', 'safari17', 'firefox119']

            for imp in impersonations:
                try:
                    response = curl_requests.get(
                        self.grok_url,
                        impersonate=imp,
                        timeout=10,
                        headers={
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Cache-Control': 'no-cache'
                        }
                    )

                    if response.status_code == 200 and len(response.text) > 1000:
                        print(f"      ✅ curl_cffi成功 ({imp})")
                        return self._extract_meta_from_html(response.text)

                except Exception:
                    continue

        except ImportError:
            pass

        return None

    def _try_alternative_endpoints(self) -> bytes:
        """策略5: 尝试替代端点"""
        import subprocess

        # 尝试不同的URL路径
        alternative_urls = [
            'https://grok.com/',
            'https://grok.com/login',
            'https://grok.com/home',
            'https://x.com/i/grok'
        ]

        for url in alternative_urls:
            try:
                curl_command = [
                    'curl', '-s', '-L', '--max-time', '8',
                    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    '--header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    '--compressed',
                    url
                ]

                result = subprocess.run(curl_command, capture_output=True, text=True, timeout=8)

                if result.returncode == 0 and len(result.stdout) > 500:
                    print(f"      ✅ 替代端点成功: {url}")
                    meta_result = self._extract_meta_from_html(result.stdout)
                    if meta_result:
                        return meta_result

            except Exception:
                continue

        return None

    def _try_cached_content(self) -> bytes:
        """策略6: 使用缓存或预设内容"""
        # 如果有真实的grok meta内容，可以在这里硬编码
        known_meta_contents = [
            "grok-site-verification-content-2024-production-v1",
            "x-grok-verification-meta-content-stable-release",
            "grok-meta-verification-string-for-api-access"
        ]

        for content in known_meta_contents:
            try:
                meta_bytes = content.encode('utf-8')
                if len(meta_bytes) < 48:
                    meta_bytes = meta_bytes + b'\x00' * (48 - len(meta_bytes))
                elif len(meta_bytes) > 48:
                    meta_bytes = meta_bytes[:48]

                print(f"      ✅ 使用预设内容: {content[:30]}...")
                return meta_bytes

            except Exception:
                continue

        return None

    def _extract_meta_from_html(self, html_content: str) -> bytes:
        """从HTML中提取meta内容"""
        patterns = [
            r'<meta\s+name=["\']grok-site-verification["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+content=["\']([^"\']+)["\']\s+name=["\']grok-site-verification["\']',
            r'grok-site-verification["\']?\s*(?:content|value)\s*=\s*["\']([^"\']+)["\']',
            # 扩展模式，查找其他可能的meta标签
            r'<meta\s+name=["\']verification["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+name=["\']site-verification["\']\s+content=["\']([^"\']+)["\']'
        ]

        for pattern in patterns:
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                verification_content = match.group(1)
                print(f"      ✅ 找到meta内容: {verification_content[:50]}...")

                # 转换为48字节
                meta_bytes = verification_content.encode('utf-8')
                if len(meta_bytes) < 48:
                    meta_bytes = meta_bytes + b'\x00' * (48 - len(meta_bytes))
                elif len(meta_bytes) > 48:
                    meta_bytes = meta_bytes[:48]

                return meta_bytes

        # 如果没找到特定的meta标签，尝试从HTML中提取其他有用信息
        if 'grok' in html_content.lower() and len(html_content) > 1000:
            # 使用HTML内容的哈希作为meta内容
            import hashlib
            content_hash = hashlib.sha256(html_content.encode()).hexdigest()[:48]
            meta_bytes = content_hash.encode('utf-8')
            if len(meta_bytes) < 48:
                meta_bytes = meta_bytes + b'\x00' * (48 - len(meta_bytes))

            print(f"      ✅ 使用内容哈希作为meta: {content_hash[:32]}...")
            return meta_bytes

        return None

    def generate_browser_fingerprint(self) -> str:
        """
        生成浏览器指纹信息 (结合方法1和方法3)

        Returns:
            指纹字符串
        """
        print("🔍 生成浏览器指纹...")

        # 模拟浏览器指纹信息
        fingerprint_data = {
            "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0",
            "language": "en",
            "languages": ["en", "en-US"],
            "platform": "MacIntel",
            "cookieEnabled": True,
            "doNotTrack": None,
            "screenWidth": 450,
            "screenHeight": 654,
            "screenColorDepth": 24,
            "screenPixelDepth": 24,
            "screenAvailWidth": 450,
            "screenAvailHeight": 654,
            "innerWidth": 450,
            "innerHeight": 654,
            "outerWidth": 1920,
            "outerHeight": 1055,
            "timezone": "America/New York",
            "timezoneOffset": -400,
            "hardwareConcurrency": 14,
            "deviceMemory": 16,
            "maxTouchPoints": 0
        }

        # 方法3: 生成指纹哈希
        fingerprint_string = json.dumps(fingerprint_data, sort_keys=True, separators=(',', ':'))
        fingerprint_hash = hashlib.sha256(fingerprint_string.encode('utf-8')).hexdigest()

        print(f"   指纹数据长度: {len(fingerprint_string)} 字符")
        print(f"   指纹哈希: {fingerprint_hash[:32]}...")

        return fingerprint_hash

    def generate_x_statsig_id(self, method: str = "GET", pathname: str = "/") -> str:
        """
        生成完整的 x-statsig-id

        Args:
            method: 请求方式 (GET/POST)
            pathname: 请求路径

        Returns:
            生成的 x-statsig-id 字符串
        """
        print("=" * 60)
        print("🚀 开始生成 x-statsig-id")
        print("=" * 60)

        print(f"📋 生成参数:")
        print(f"   Method: {method}")
        print(f"   Pathname: {pathname}")

        # 1. 获取 grok.com 的 meta content
        meta_content = self.get_grok_meta_content()

        # 2. 生成浏览器指纹
        fingerprint = self.generate_browser_fingerprint()

        # 3. 生成当前时间戳
        current_timestamp = int(time.time())
        relative_timestamp = current_timestamp - self.base_timestamp

        print(f"⏰ 时间信息:")
        print(f"   当前时间戳: {current_timestamp}")
        print(f"   基准时间戳: {self.base_timestamp}")
        print(f"   相对时间戳: {relative_timestamp}")

        # 4. 生成时间戳字节 (小端序)
        timestamp_bytes = struct.pack('<I', relative_timestamp)
        print(f"   时间戳字节: {timestamp_bytes.hex()}")

        # 5. 生成SHA256
        sha_input = f"{method}!{pathname}!{relative_timestamp}{fingerprint}"
        sha256_hash = hashlib.sha256(sha_input.encode('utf-8')).digest()
        sha256_16bytes = sha256_hash[:16]

        print(f"🔐 SHA256信息:")
        print(f"   输入字符串: {sha_input[:100]}...")
        print(f"   SHA256前16字节: {sha256_16bytes.hex()}")

        # 6. 固定值
        fixed_byte = b'\x03'

        # 7. 组合payload数据
        payload_data = meta_content + timestamp_bytes + sha256_16bytes + fixed_byte
        print(f"📦 Payload长度: {len(payload_data)} 字节")

        # 8. 生成异或key并加密
        xor_key = secrets.randbits(8)
        encrypted_payload = bytes([b ^ xor_key for b in payload_data])

        print(f"🔑 异或信息:")
        print(f"   异或key: 0x{xor_key:02x} ({xor_key})")

        # 9. 组合最终数据
        final_data = bytes([xor_key]) + encrypted_payload
        print(f"   最终数据长度: {len(final_data)} 字节")

        # 10. Base64编码
        result = base64.b64encode(final_data).decode('utf-8')

        print(f"✅ 生成结果:")
        print(f"   x-statsig-id: {result}")
        print(f"   长度: {len(result)} 字符")

        return result

    def verify_generated_id(self, statsig_id: str) -> bool:
        """
        验证生成的ID结构是否正确

        Args:
            statsig_id: 要验证的ID

        Returns:
            验证是否通过
        """
        print("\n" + "=" * 60)
        print("🔍 验证生成的ID结构")
        print("=" * 60)

        try:
            # Base64解码
            decoded_bytes = base64.b64decode(statsig_id)
            print(f"✅ Base64解码成功，长度: {len(decoded_bytes)} 字节")

            # 提取异或key
            xor_key = decoded_bytes[0]
            print(f"✅ 异或key: 0x{xor_key:02x} ({xor_key})")

            # 异或解密
            decrypted = bytearray()
            for i in range(1, len(decoded_bytes)):
                decrypted.append(decoded_bytes[i] ^ xor_key)

            print(f"✅ 解密后长度: {len(decrypted)} 字节")

            # 验证数据结构
            expected_length = 48 + 4 + 16 + 1  # meta + timestamp + sha256 + fixed
            if len(decrypted) == expected_length:
                print(f"✅ 数据长度正确: {len(decrypted)}/{expected_length}")
            else:
                print(f"❌ 数据长度错误: {len(decrypted)}/{expected_length}")
                return False

            # 检查固定值
            fixed_val = decrypted[-1]
            if fixed_val == 3:
                print(f"✅ 固定值正确: {fixed_val}")
            else:
                print(f"❌ 固定值错误: {fixed_val} (期望: 3)")
                return False

            # 解析时间戳
            timestamp_bytes = decrypted[48:52]
            timestamp = struct.unpack('<I', timestamp_bytes)[0]
            actual_time = self.base_timestamp + timestamp

            print(f"✅ 时间戳解析:")
            print(f"   相对时间: {timestamp} 秒")
            print(f"   绝对时间: {actual_time}")
            print(f"   时间差: {abs(time.time() - actual_time):.1f} 秒")

            print("🎉 ID结构验证通过！")
            return True

        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False

def main():
    """主函数 - 演示完整流程"""
    generator = XStatsigIDGenerator()

    # 生成 x-statsig-id
    method = "POST"
    pathname = "/rest/app-chat/conversations/new"

    statsig_id = generator.generate_x_statsig_id(method, pathname)
    print("Generated id", statsig_id)

    # 验证生成的ID
    generator.verify_generated_id(statsig_id)

    print(f"\n" + "=" * 60)
    print("📋 使用说明")
    print("=" * 60)
    print("在HTTP请求中使用:")
    print(f"Headers: {{'x-statsig-id': '{statsig_id}'}}")

if __name__ == "__main__":
    main()
