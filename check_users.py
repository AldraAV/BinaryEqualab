import requests

URL = "https://sabkqxdnefbspmkglezb.supabase.co"
import os
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_XXXXXXXX")

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json"
}

# Check auth.users
print("=== AUTH USERS ===")
res = requests.get(f"{URL}/auth/v1/admin/users", headers=headers)
if res.status_code == 200:
    users = res.json().get('users', [])
    for u in users:
        print(f"ID: {u.get('id')} | Email: {u.get('email')}")
else:
    print(res.status_code, res.text)

# Check public.users
print("\n=== PUBLIC USERS ===")
res2 = requests.get(f"{URL}/rest/v1/users?select=*", headers=headers)
if res2.status_code == 200:
    for u in res2.json():
        print(u)
else:
    print(res2.status_code, res2.text)
