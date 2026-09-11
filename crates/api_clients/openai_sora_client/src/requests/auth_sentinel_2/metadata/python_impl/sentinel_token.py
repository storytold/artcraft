import requests, json
from uuid import uuid4
from proof_of_work import get_pow_token

current_parameters = None


def generate_id():
    return str(uuid4())

def generate_payload(data, flow):
    data['id'] = generate_id()
    data['flow'] = flow
    return json.dumps(data)

def fetch_requirements(flow, pow_token):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(
                url = "https://chatgpt.com/backend-api/sentinel/req",
                data = generate_payload({'p': pow_token}, flow),
            )
            
            result = response.json()
            return result, True
        except requests.exceptions.RequestException as err:
            if attempt >= 2:
                return generate_payload({'e': str(err)}, flow), False

def refresh_token(flow):
    pow_token = get_pow_token()
    response,_ = fetch_requirements(flow, pow_token)
    if not _:
        return response

    try:

        payload = generate_payload({
            'p': pow_token,
            't': response.get("turnstile", {}).get('dx', ""),
            'c': response.get('token')
        }, flow)
        return payload
    except Exception as err:
        failure = generate_payload({'e': str(err), 'p': pow_token}, flow)
        return failure

def get_sentinel_token():
    flow = 'sora_create_task'
    token = refresh_token(flow) #This can be used now in 'OpenAI-Sentinel-Token' header
    return token

if __name__ == "__main__":
    print(get_sentinel_token())