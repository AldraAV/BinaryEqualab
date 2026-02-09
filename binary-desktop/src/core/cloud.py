import requests
import json
import os
from typing import Optional, Dict, List

# Default to creating a config file for persistence
CONFIG_FILE = os.path.join(os.path.expanduser("~"), ".binary_equalab_config.json")

class CloudClient:
    def __init__(self):
        self.token: Optional[str] = None
        self.user: Optional[Dict] = None
        self.api_url = "http://localhost:8000" # Default Dev
        # self.api_url = "https://binaryequalab.onrender.com" # Prod
        
        self.load_config()

    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    data = json.load(f)
                    self.token = data.get('token')
                    self.user = data.get('user')
                    self.api_url = data.get('api_url', self.api_url)
            except Exception as e:
                print(f"Error loading config: {e}")

    def save_config(self):
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump({
                    'token': self.token,
                    'user': self.user,
                    'api_url': self.api_url
                }, f)
        except Exception as e:
            print(f"Error saving config: {e}")

    def is_logged_in(self) -> bool:
        return self.token is not None

    def login(self, email, password) -> bool:
        try:
            url = f"{self.api_url}/api/auth/login"
            print(f"Logging in to {url}...")
            resp = requests.post(url, json={"email": email, "password": password})
            
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get('access_token')
                self.user = data.get('user')
                self.save_config()
                return True
            else:
                print(f"Login failed: {resp.text}")
                return False
        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def logout(self):
        self.token = None
        self.user = None
        self.save_config()

    def get_headers(self):
        if not self.token:
            return {}
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def list_worksheets(self) -> List[Dict]:
        if not self.is_logged_in(): return []
        try:
            resp = requests.get(f"{self.api_url}/api/worksheets", headers=self.get_headers())
            if resp.status_code == 200:
                return resp.json()
            return []
        except Exception as e:
            print(f"Error fetching worksheets: {e}")
            return []

    def save_worksheet(self, title: str, content: Dict) -> bool:
        if not self.is_logged_in(): return False
        try:
            payload = {
                "title": title,
                "content": content, # JSON structure of the worksheet
                "is_public": False
            }
            # Note: Backend expects "content" as JSON/Dict usually.
            # Adjust endpoint if it assumes file upload.
            # Assuming standard JSON POST for now.
            resp = requests.post(f"{self.api_url}/api/worksheets", json=payload, headers=self.get_headers())
            return resp.status_code in [200, 201]
        except Exception as e:
            print(f"Error saving worksheet: {e}")
            return False

# Global instance
cloud_client = CloudClient()
