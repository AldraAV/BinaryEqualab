import warnings
import sys
import os

# Force UTF-8 output
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Suprimir warnings para evitar falso error de PowerShell
warnings.filterwarnings("ignore")

try:
    from main import app
    print("IMPORT_OK", flush=True)
    
    # Test statistics endpoint
    from fastapi.testclient import TestClient
    client = TestClient(app)
    response = client.post('/api/statistics/descriptive', json={'data': [1,2,3,4,5]})
    print(f"STATS_STATUS: {response.status_code}", flush=True)
    if response.status_code == 200:
        print(f"STATS_RESULT: {response.json()}", flush=True)
    else:
        print(f"STATS_ERROR: {response.text}", flush=True)
    
    sys.exit(0)
except Exception as e:
    print(f"IMPORT_FAIL: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
    sys.exit(1)
