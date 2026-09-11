import hashlib, json, random, time, uuid, pybase64
from datetime import datetime, timedelta, timezone
from config import cores, cached_scripts, cached_dpl, navigator_key, document_key, window_key


MAX_ITERATION = 500000

def get_parse_time():
    now = datetime.now(timezone(timedelta(hours=-5)))
    return now.strftime("%a %b %d %Y %H:%M:%") + " GMT-0500 (Eastern Standard Time)"



def get_config(user_agent):
    config = [
        random.choice([1920 + 1080, 2560 + 1440, 1920 + 1200, 2560 + 1600]),
        get_parse_time(),
        4294705152,
        0,
        user_agent,
        random.choice(cached_scripts) if cached_scripts else "",
        cached_dpl,
        "en-US",
        "en-US,es-US,en,es",
        0,
        random.choice(navigator_key),
        random.choice(document_key),
        random.choice(window_key),
        time.perf_counter() * 1000,
        str(uuid.uuid4()),
        "",
        random.choice(cores),
        time.time() * 1000 - (time.perf_counter() * 1000),
    ]
    return config



def generate_answer(seed, diff, config):
    diff_len = len(diff)
    seed_encoded = seed.encode()
    static_config_part1 = (json.dumps(config[:3], separators=(',', ':'), ensure_ascii=False)[:-1] + ',').encode()
    static_config_part2 = (',' + json.dumps(config[4:9], separators=(',', ':'), ensure_ascii=False)[1:-1] + ',').encode()
    static_config_part3 = (',' + json.dumps(config[10:], separators=(',', ':'), ensure_ascii=False)[1:]).encode()

    target_diff = bytes.fromhex(diff)

    for i in range(MAX_ITERATION):
        dynamic_json_i = str(i).encode()
        dynamic_json_j = str(i >> 1).encode()
        final_json_bytes = static_config_part1 + dynamic_json_i + static_config_part2 + dynamic_json_j + static_config_part3
        base_encode = pybase64.b64encode(final_json_bytes)
        hash_value = hashlib.sha3_512(seed_encoded + base_encode).digest()
        if hash_value[:diff_len] <= target_diff:
            return base_encode.decode(), True

    return "wQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D" + pybase64.b64encode(f'"{seed}"'.encode()).decode(), False


def get_requirements_token(config):
    seed = format(random.random())
    diff = "0fffff"
    solution, found = generate_answer(seed, diff, config)
    return 'gAAAAAC' + solution

def get_pow_token():
    config = get_config("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")
    return get_requirements_token(config)

if __name__ == "__main__":
    print(get_pow_token())