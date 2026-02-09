from fastapi import HTTPException, Depends
from supabase import create_client, Client
from auth import get_current_user, User
import os
from datetime import datetime
from typing import Optional

# Initialize Supabase Client - Optional
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Optional[Client] = None
if url and key:
    supabase = create_client(url, key)
else:
    print("⚠️ Supabase credentials not configured - rate limiting disabled")

# Define Limits
PLAN_LIMITS = {
    "free":  {"ai_calls": 20,   "worksheets": 5},
    "pro":   {"ai_calls": 200,  "worksheets": 50},
    "elite": {"ai_calls": None, "worksheets": None}  # None means unlimited
}

async def check_ai_quota(user: User = Depends(get_current_user)):
    """
    Middleware injected into AI endpoints.
    1. Gets user plan.
    2. Checks if quota exceeded.
    3. Increments usage if allowed.
    4. Logs request.
    """
    
    # If Supabase not configured, allow unlimited access
    if not supabase:
        return user
    
    # 1. Get User Plan
    try:
        response = supabase.table("users_plans").select("*").eq("user_id", user.id).single().execute()
        
        # If user has no plan record, create a default 'free' plan immediately (Auto-provisioning)
        if not response.data:
            new_plan = {
                "user_id": user.id,
                "plan": "free",
                "ai_calls_used": 0,
                "period_end": "now() + interval '1 month'" 
            }
            # Insert and fetch
            insert_res = supabase.table("users_plans").insert(new_plan).execute()
            if insert_res.data:
                response = insert_res
                # Need to re-shape response to match select structure locally
                plan_data = insert_res.data[0]
            else:
                raise HTTPException(status_code=500, detail="Failed to initialize user plan.")
        else:
            plan_data = response.data

    except Exception as e:
        print(f"Plan Check Error: {e}")
        # Fail open or closed? Here failed closed (safe)
        raise HTTPException(status_code=500, detail="Error checking subscription status.")

    plan_name = plan_data.get("plan", "free")
    current_usage = plan_data.get("ai_calls_used", 0)
    
    # Get limit logic
    limits = PLAN_LIMITS.get(plan_name, PLAN_LIMITS["free"])
    max_calls = limits["ai_calls"]
    
    # 2. Check Infinite Plan
    if max_calls is None:
        _log_usage(user.id, plan_name)
        return user
    
    # 3. Check Quota
    if current_usage >= max_calls:
        # Check if we should rotate period (simple check locally if cron failed)
        # For now, simplistic hard blocking
        raise HTTPException(
            status_code=429,
            detail={
                "message": "AI Queries Limit Reached",
                "plan": plan_name,
                "limit": max_calls,
                "reset": plan_data.get("period_end")
            }
        )

    # 4. Increment Usage
    try:
        supabase.table("users_plans").update({
            "ai_calls_used": current_usage + 1,
            "updated_at": "now()"
        }).eq("user_id", user.id).execute()
        
        _log_usage(user.id, plan_name)

    except Exception as e:
        print(f"Usage Update Error: {e}")
        # We allow the call to proceed even if counting fails? 
        # Ideally no, but for UX maybe yes. Let's block for consistency.
        raise HTTPException(status_code=500, detail="Failed to update usage quota.")

    return user

def _log_usage(user_id: str, plan_name: str):
    try:
        supabase.table("usage_log").insert({
            "user_id": user_id,
            "endpoint": "ai",
            "plan_at_call": plan_name
        }).execute()
    except Exception as e:
        print(f"Logging Error: {e}")
        # Logging failure shouldn't stop the user
        pass
