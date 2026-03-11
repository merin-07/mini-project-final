import base64
import requests
import json

with open("bill.png", "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode("utf-8")

payload = {"image_base64": img_base64}
headers = {"Content-Type": "application/json"}

print("Sending request to http://127.0.0.1:8000/extract...")
response = requests.post("http://127.0.0.1:8000/extract", json=payload, headers=headers)

if response.ok:
    print("Success!")
    print(json.dumps(response.json(), indent=2))
else:
    print(f"Error {response.status_code}: {response.text}")
