import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Service Role is needed to see/edit all users
supabase_url = os.environ.get("SUPABASE_URL")
supabase_service_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_service_key)

router = APIRouter()

@router.get("/api/cron/reset")
async def reset_monthly_quotas(secret: str = None):
    # Optional: Simple security check
    # if secret != os.environ.get("CRON_SECRET"):
    #     raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # 1. Get users who need reset (period_end < now())
        # Note: formatting datetime to ISO for Postgres comparison
        now_iso = datetime.utcnow().isoformat()
        
        response = supabase.table("users_plans").select("*").lt("period_end", now_iso).execute()
        users_to_reset = response.data
        
        count = 0
        if users_to_reset:
            for user in users_to_reset:
                user_id = user['user_id']
                
                # 2. Reset logic
                # We extend period_end by 1 month. 
                # Since we are in Python, relying on DB to calculate interval is safer, 
                # but update(json) expects values.
                # Let's use a Python calculation or rely on a SQL function if possible.
                # For MVP, let's just use Python to add 30 days roughly, or better yet:
                # We can't easily invoke "period_end + interval 1 month" in a simple update call via API 
                # without a Stored Procedure.
                
                # ALTERNATIVE: Just reset usage. Leave period_end? 
                # No, if we don't update period_end, they will be reset every minute.
                
                # Robust Way: Calculate new date in Python
                # But parsing Postgres dates is annoying.
                
                # Let's use the RPC approach. It's the only atomic way.
                # I will define the RPC SQL for the user to run.
                pass

        # Since we can't easily iterate and update with "interval syntax" purely via JSON API,
        # we will use a Stored Procedure (RPC).
        # This endpoint will call the RPC.
        
        rpc_response = supabase.rpc('reset_monthly_quotas').execute()
        
        return {"status": "success", "message": "Cron Job Executed via RPC"}

    except Exception as e:
        # If RPC fails (e.g. doesn't exist), fallback to manual loop or return error
        return {"status": "error", "message": str(e), "hint": "Did you run the cron_reset.sql script?"}
