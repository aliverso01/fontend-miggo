import http.client
import json

conn = http.client.HTTPConnection("localhost", 8000)
headers = {
    'Authorization': 'bWlnZ29fYWRtaW5fc2VjcmV0X2tleV8yMDI0'
}
conn.request("GET", "/api/v1/subscription/plan/list/", headers=headers)
res = conn.getresponse()
data = res.read()

print("Status:", res.status)
print("Response:", data.decode("utf-8"))
