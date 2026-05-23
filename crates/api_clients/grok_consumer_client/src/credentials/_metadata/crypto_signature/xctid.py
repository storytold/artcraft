#!/usr/bin/env python3

# From https://github.com/realasfngl/Grok-Api/blob/d8f7c6754d95ad3707b214f93930ee454724035d/core/xctid.py

from math      import floor, copysign, pi, cos, sin
from base64    import b64decode, b64encode
from re        import findall, sub
from typing    import List, Dict
from random    import random
from hashlib   import sha256
from struct    import pack
from time      import time


class Signature:


    @staticmethod
    def _h(x: float, _param: float, c: float, e: bool):
        f = ((x * (c - _param)) / 255.0) + _param
        if e:
            return floor(f)
        rounded = round(float(f), 2)
        if rounded == 0.0:
            return 0.0
        return rounded

    @staticmethod
    def cubicBezierEased(t: float, x1: float, y1: float, x2: float, y2: float) -> float:
        def bezier(u: float):
            omu = 1.0 - u
            b1 = 3.0 * omu * omu * u
            b2 = 3.0 * omu * u * u
            b3 = u * u * u
            x = b1 * x1 + b2 * x2 + b3
            y = b1 * y1 + b2 * y2 + b3
            return x, y

        lo, hi = 0.0, 1.0
        for _ in range(80):
            mid = 0.5 * (lo + hi)
            if bezier(mid)[0] < t:
                lo = mid
            else:
                hi = mid
        u = 0.5 * (lo + hi)
        return bezier(u)[1]

    @staticmethod
    def xa(svg: str) -> List[List[int]]:
        s = (svg)
        substr = s[9:]
        parts = substr.split("C")
        out = []
        for part in parts:
            cleaned = sub(r"[^\d]+", " ", part).strip()
            if cleaned == "":
                nums = [0]
            else:
                nums = [int(tok) for tok in cleaned.split() if tok != ""]
            out.append(nums)
        return out

    @staticmethod
    def tohex(num: float) -> str:
        rounded = round(float(num), 2)
        if rounded == 0.0:
            return "0"
        sign = "-" if copysign(1.0, rounded) < 0 else ""
        absval = abs(rounded)
        intpart = int(floor(absval))
        frac = absval - intpart
        if frac == 0.0:
            return sign + format(intpart, "x")
        frac_digits = []
        f = frac
        for _ in range(20):
            f *= 16
            digit = int(floor(f + 1e-12))
            frac_digits.append(format(digit, "x"))
            f -= digit
            if abs(f) < 1e-12:
                break
        frac_str = "".join(frac_digits).rstrip("0")
        if frac_str == "":
            return sign + format(intpart, "x")
        return sign + format(intpart, "x") + "." + frac_str

    @staticmethod
    def simulateStyle(values: List[int], c: int) -> Dict[str,str]:
        duration = 4096
        currentTime = round(c / 10.0) * 10
        t = currentTime / duration

        cp = [Signature._h(v, -1 if (i % 2) else 0, 1, False) for i, v in enumerate(values[7:])]

        easedY = Signature.cubicBezierEased(t, cp[0], cp[1], cp[2], cp[3])

        start = [float(x) for x in values[0:3]]
        end = [float(x) for x in values[3:6]]
        r = round(start[0] + (end[0] - start[0]) * easedY)
        g = round(start[1] + (end[1] - start[1]) * easedY)
        b = round(start[2] + (end[2] - start[2]) * easedY)
        color = f"rgb({r}, {g}, {b})"

        endAngle = Signature._h(values[6], 60, 360, True)
        angle = endAngle * easedY
        rad = angle * pi / 180.0

        def is_effectively_zero(val: float) -> bool:
            return abs(val) < 1e-7

        def is_effectively_integer(val: float) -> bool:
            return abs(val - round(val)) < 1e-7

        cosv = cos(rad)
        sinv = sin(rad)

        if is_effectively_zero(cosv):
            a = 0
            d = 0
        else:
            if is_effectively_integer(cosv):
                a = int(round(cosv))
                d = int(round(cosv))
            else:
                a = f"{cosv:.6f}"
                d = f"{cosv:.6f}"

        if is_effectively_zero(sinv):
            bval = 0
            cval = 0
        else:
            if is_effectively_integer(sinv):
                bval = int(round(sinv))
                cval = int(round(-sinv))
            else:
                bval = f"{sinv:.7f}"
                cval = f"{(-sinv):.7f}"

        transform = f"matrix({a}, {bval}, {cval}, {d}, 0, 0)"
        return {"color": color, "transform": transform}

    @staticmethod
    def xs(x_bytes: bytes, svg: str, x_values: list) -> str:
        arr = list(x_bytes)
        idx = arr[x_values[0]] % 16
        c = ((arr[x_values[1]] % 16) * (arr[x_values[2]] % 16)) * (arr[x_values[3]] % 16)
        o = Signature.xa(svg)
        vals = o[idx]
        k = Signature.simulateStyle(vals, c)

        concat = str(k["color"]) + str(k["transform"])
        matches = findall(r"[\d\.\-]+", concat)
        converted = []
        for m in matches:
            num = float(m)
            hexstr = Signature.tohex(num)
            converted.append(hexstr)
        joined = "".join(converted)
        cleaned = joined.replace(".", "").replace("-", "")
        return cleaned

    @staticmethod
    def generate_sign(path: str, method: str, verification: str, svg: str, x_values: list, time_n: int = None, random_float: float = None) -> str:

        n = int(time() - 1682924400) if not time_n else time_n
        t = pack('<I', n)
        r = b64decode(verification)
        o = Signature.xs(r, svg, x_values)

        msg = "!".join([method, path, str(n)]) + "obfiowerehiring" + o
        digest = sha256(msg.encode('utf-8')).digest()[:16]

        prefix_byte = int(floor(random() if not random_float else random_float * 256))
        assembled = bytes([prefix_byte]) + r + t + digest + bytes([3])

        arr = bytearray(assembled)
        if len(arr) > 0:
            first = arr[0]
            for i in range(1, len(arr)):
                arr[i] = arr[i] ^ first

        return b64encode(bytes(arr)).decode('ascii').replace('=', '')


def main():
    sig = Signature.generate_sign('/rest/app-chat/conversations/new', 'POST', self.verification_token, self.svg_data, self.numbers)
    print('Signature', sig)
    pass

if __name__ == 'main':
    main()
