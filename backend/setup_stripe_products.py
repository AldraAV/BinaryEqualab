import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

if not stripe.api_key:
    print("Error: STRIPE_SECRET_KEY not found in .env")
    exit(1)

def create_product(name, description, price_cents):
    print(f"Creating/Checking product: {name}...")
    
    # Check if exists (simple check by searching)
    search = stripe.Product.search(query=f"name:'{name}'", limit=1)
    if search['data']:
        prod = search['data'][0]
        print(f"  -> Found existing product: {prod.id}")
        # Get price
        prices = stripe.Price.list(product=prod.id, limit=1)
        if prices['data']:
            print(f"  -> Price ID: {prices['data'][0].id}")
            return prices['data'][0].id
    
    # Create
    prod = stripe.Product.create(name=name, description=description)
    price = stripe.Price.create(
        product=prod.id,
        unit_amount=price_cents,
        currency="usd",
        recurring={"interval": "month"}
    )
    print(f"  -> Created! Price ID: {price.id}")
    return price.id

print("--- Setting up Stripe Products ---")

pro_price = create_product("Binary EquaLab PRO", "200 AI Calls + 50 Worksheets", 499)
elite_price = create_product("Binary EquaLab ELITE", "Unlimited AI + Worksheets", 1499)

print("\n--- COPY THESE TO .env ---")
print(f"STRIPE_PRICE_PRO={pro_price}")
print(f"STRIPE_PRICE_ELITE={elite_price}")
