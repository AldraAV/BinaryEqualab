import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

EMAIL = "manhalev1520@gmail.com"

print(f"Attempting to upgrade {EMAIL} to PRO...")

# 1. Get User ID
# Note: In some versions of supabase-py, auth.admin is used for admin tasks
try:
    # Try looking up via a secure table if auth.admin fails, or assume we can list
    # Actually, let's try to just update users_plans blindly? No, we need user_id.
    # Let's try listing users (might be slow if many, but here is fine)
    # or assume the library supports admin.
    
    # Try to find user in our public.users_plans table via a join? No.
    # Let's try raw SQL via .rpc if we had one.
    
    # Standard way with service key in newer py libs:
    # users = supabase.auth.admin.list_users() 
    # But let's try a direct query to our public table if we can't access auth.
    
    # Wait, the user has already logged in, so they ARE in users_plans with 'free'.
    # But users_plans doesn't have the email column, only user_id.
    
    # Strategy: We can't easily get the ID by email via the Table API unless we exposed email in users_plans (user_id is FK).
    # BUT, we can use the Service Key to list users from Auth if supported.
    
    # Let's try this:
    try:
        # Does the python client support admin?
        # It's a wrapper around gotrue-py.
        # Let's try to sign in? No.
        
        # Let's try to get ID from a known attribute?
        # Actually, let's just ask the admin API for the user by email.
        # If that fails, I'll print "Please run SQL".
        
        # NOTE: supabase-py v2+
        user_response = supabase.auth.admin.get_user_by_id("dummy") # Just to check existence?
        pass
    except:
        pass

    # Actually, easier hack:
    # We can't.
    # Let's assume the user IS 'manhalev1520@gmail.com'.
    # I will modify the script to try and find the user ID by listing.
    
    res = supabase.auth.admin.list_users()
    user_id = None
    for u in res:
        if u.email == EMAIL:
            user_id = u.id
            break
            
    if not user_id:
        # Pagination might hide it, but unlikely for a small project.
        print("User not found in first page of Auth users.")
        exit(1)
        
    print(f"Found User ID: {user_id}")
    
    # 2. Upsert Plan (Insert if missing, Update if exists)
    data = {
        "user_id": user_id,
        "plan": "pro",
        "ai_calls_limit": 200,
        "worksheets_limit": 50,
        "ai_calls_used": 0, # Reset usage on upgrade or init
        "worksheets_count": 0,
        "period_end": "now() + interval '1 month'", # simple string for SQL to handle? No, python client might need literal. 
        # Actually safer to let DB handle defaults if we could, but upsert needs values.
        # Let's try minimal upsert for existing columns.
    }
    
    # Python client doesn't support SQL intervals easily in JSON. 
    # Let's rely on default? No, upsert needs data.
    # Let's just set the plan. Limit is what matters.
    # For timestamps, we can omit and let DB default for new rows? 
    # But for existing rows we might want to keep them.
    # UPSERT strategy:
    
    # 2. Update Plan (Row exists, so we update)
    data = {
        "plan": "elite",
        "ai_calls_limit": None,
        "worksheets_limit": None,
        "updated_at": "now()"
    }
    
    # Explicit update
    response = supabase.table("users_plans").update(data).eq("user_id", user_id).execute()
    
    print("Update executed.")
    
    # 3. Verify
    verify = supabase.table("users_plans").select("*").eq("user_id", user_id).execute()
    print("Verification Data:", verify.data)
    
    if verify.data and verify.data[0]['plan'] == 'elite':
        print("FINAL SUCCESS: Plan is ELITE (Database Confirmed).")
    else:
        print("FAILURE: Plan upgrade did not persist.")

except Exception as e:
    print(f"An error occurred: {e}")
    # Fallback explanation
    print("If this failed, please run the SQL script in backend/upgrade_user.sql manually.")
