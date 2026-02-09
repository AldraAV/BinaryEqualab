import os
import stripe
from fastapi import APIRouter, Header, Request, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional

load_dotenv()

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET") # We'll need to set this later
PRO_PRICE_ID = os.environ.get("STRIPE_PRICE_PRO")
ELITE_PRICE_ID = os.environ.get("STRIPE_PRICE_ELITE")
FRONTEND_URL = "http://localhost:3000" # Updated to user's port

# Initialize Supabase (Service Role for Webhooks)
supabase_url = os.environ.get("SUPABASE_URL")
supabase_service_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase_admin: Client = create_client(supabase_url, supabase_service_key)

router = APIRouter()

class CheckoutRequest(BaseModel):
    plan: str # 'pro' or 'elite'
    user_id: str
    email: str

@router.post("/api/create-checkout-session")
async def create_checkout_session(data: CheckoutRequest):
    price_id = PRO_PRICE_ID if data.plan == 'pro' else ELITE_PRICE_ID
    
    if not price_id:
        raise HTTPException(status_code=500, detail="Price ID not configured")

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/dashboard",
            customer_email=data.email,
            client_reference_id=data.user_id,
            metadata={
                "user_id": data.user_id,
                "plan": data.plan
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/verify-session/{session_id}")
async def verify_session(session_id: str):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == 'paid':
            # Reuse logic (refactor later for DRY)
            user_id = session.get('client_reference_id')
            metadata = session.get('metadata', {})
            plan_name = metadata.get('plan')
            
            if user_id and plan_name:
                limits = {
                    "pro": {"ai": 200, "ws": 50},
                    "elite": {"ai": None, "ws": None}
                }
                selected_limits = limits.get(plan_name, limits['pro'])
                
                update_data = {
                    "plan": plan_name,
                    "ai_calls_limit": selected_limits['ai'],
                    "worksheets_limit": selected_limits['ws'],
                    "stripe_customer_id": session.get('customer'),
                    "stripe_subscription_id": session.get('subscription'),
                    "updated_at": "now()"
                }
                
                supabase_admin.table("users_plans").update(update_data).eq("user_id", user_id).execute()
                print(f"Verified & Upgraded: {user_id} -> {plan_name}")
                return {"status": "success", "plan": plan_name}
        
        return {"status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api/stripe-webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    
    try:
        if STRIPE_WEBHOOK_SECRET:
             event = stripe.Webhook.construct_event(
                payload, stripe_signature, STRIPE_WEBHOOK_SECRET
            )
        else:
            # Dev mode fallback if no secret (security risk in prod)
            event = stripe.Event.construct_from(
                import_json(payload), stripe.api_key
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        # Retrieve metadata
        user_id = session.get('client_reference_id')
        # Or from metadata
        metadata = session.get('metadata', {})
        plan_name = metadata.get('plan')
        
        if user_id and plan_name:
            print(f"Payment success for {user_id} -> {plan_name}")
            
            # Update Plan in DB
            limits = {
                "pro": {"ai": 200, "ws": 50},
                "elite": {"ai": None, "ws": None} # None = Unlimited
            }
            
            selected_limits = limits.get(plan_name, limits['pro'])
            
            update_data = {
                "plan": plan_name,
                "ai_calls_limit": selected_limits['ai'],
                "worksheets_limit": selected_limits['ws'],
                "stripe_customer_id": session.get('customer'),
                "stripe_subscription_id": session.get('subscription'),
                "updated_at": "now()"
            }
            
            # Using Service Role Key to bypass RLS if needed, or just standard
            supabase_admin.table("users_plans").update(update_data).eq("user_id", user_id).execute()

    return {"status": "success"}

def import_json(payload):
    import json
    return json.loads(payload)
