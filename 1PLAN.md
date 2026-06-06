José Avilés Cárdenas, [01/02/2026 07:32 p. m.]
# Binary EquaLab — Plan de Integración SaaS
## Modelo: Open Core

---

## Fase 0: Definir los Límites (antes de escribir código)

Qué es libre (siempre):
- EquaEngine completo (derivar, integrar, resolver, factorizar, etc.)
- CLI, Desktop, Web básica
- Epicycles PRO
- Calculadora CAS sin límite
- Gratis para siempre, open source

Qué se limita por plan:
- Consultas de IA (Kimi K2) → Esto cuesta dinero real
- Ejercicios generados por IA
- Explicaciones por IA
- Worksheets guardados en la nube (cantidad)

---

## Fase 1: Estructura de Planes

┌─────────────────────────────────────────────┐
│  FREE                                       │
│  - EquaEngine: ilimitado                    │
│  - IA: 20 consultas/mes                     │
│  - Worksheets en nube: 5                    │
│  - Sin tarjeta de crédito                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  PRO — $4.99 USD/mes                        │
│  - EquaEngine: ilimitado                    │
│  - IA: 200 consultas/mes                    │
│  - Worksheets en nube: 50                   │
│  - Respuestas IA con mayor contexto         │
│  - Exportación PDF                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ELITE — $14.99 USD/mes                     │
│  - Todo lo de PRO                           │
│  - IA: ilimitado                            │
│  - Worksheets: ilimitados                   │
│  - Modo profesor (genera exámenes)          │
│  - Integración con LMS (futuro)             │
└─────────────────────────────────────────────┘
Los precios están pensados para estudiantes latinoamericanos.
No es para competir con Wolfram Alpha ($10 USD/mes).
Es para ser la alternativa accesible.

---

## Fase 2: Backend — Lo que necesita cambiar

### 2.1 tabla en Supabase: users_plans

CREATE TABLE users_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  ai_calls_used INTEGER DEFAULT 0,
  ai_calls_limit INTEGER DEFAULT 20,
  worksheets_count INTEGER DEFAULT 0,
  worksheets_limit INTEGER DEFAULT 5,
  period_start TIMESTAMPTZ DEFAULT now(),
  period_end TIMESTAMPTZ DEFAULT now() + INTERVAL '1 month',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
### 2.2 Tabla: usage_log (para auditoría y analytics)

CREATE TABLE usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,           -- '/api/ai/solve', '/api/ai/explain', etc.
  called_at TIMESTAMPTZ DEFAULT now(),
  tokens_used INTEGER,
  plan_at_call TEXT        -- snapshotear el plan al momento de la llamada
);
### 2.3 Middleware de Rate Limiting (nuevo archivo: rate_limiter.py)

`python
# backend/rate_limiter.py

from fastapi import HTTPException, Depends
from supabase import create_client
from auth import get_current_user, User
import os

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

PLAN_LIMITS = {
    "free":  {"ai_calls": 20,   "worksheets": 5},
    "pro":   {"ai_calls": 200,  "worksheets": 50},
    "elite": {"ai_calls": None, "worksheets": None}  # None = ilimitado
}

async def check_ai_quota(user: User = Depends(get_current_user)):
    """
    Middleware que se inyecta en los endpoints de IA.
    Verifica si el usuario tiene cuota disponible.
    Si no → 429 (Too Many Requests).
    Si sí → permite pasar y incrementa el contador.
    """
    # 1. Obtener plan del usuario
    response = supabase.table("users_plans").select("*").eq("user_id", user.id).single().execute()

José Avilés Cárdenas, [01/02/2026 07:32 p. m.]
if not response.data:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    plan_data = response.data
    plan = plan_data["plan"]
    limit = PLAN_LIMITS[plan]["ai_calls"]
    
    # 2. Si es elite, no hay límite
    if limit is None:
        return user
    
    # 3. Verificar si excedió el límite
    if plan_data["ai_calls_used"] >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Límite de consultas de IA alcanzado este mes.",
                "plan_actual": plan,
                "límite": limit,
                "usado": plan_data["ai_calls_used"],
                "reset_en": plan_data["period_end"]
            }
        )
    
    # 4. Incrementar contador
    supabase.table("users_plans").update({
        "ai_calls_used": plan_data["ai_calls_used"] + 1,
        "updated_at": "now()"
    }).eq("user_id", user.id).execute()
    
    # 5. Loguear en usage_log
    supabase.table("usage_log").insert({
        "user_id": user.id,
        "endpoint": "ai",
        "plan_at_call": plan
    }).execute()
    
    return user

### 2.4 Modificación de main.py — Inyectar el middleware en endpoints de IA

python
# En main.py, reemplazar los endpoints de IA así:

from rate_limiter import check_ai_quota

@app.post("/api/ai/solve")
async def ai_solve(req: AIRequest, user: User = Depends(check_ai_quota)):
    return await kimi_service.solve_math_problem(req.query)

@app.post("/api/ai/explain")
async def ai_explain(req: AIRequest, user: User = Depends(check_ai_quota)):
    result = await kimi_service.explain_concept(req.query)
    return {"explanation": result}

@app.post("/api/ai/exercises")
async def ai_exercises(req: AIExercisesRequest, user: User = Depends(check_ai_quota)):
    return await kimi_service.generate_exercises(req.topic, req.count, req.difficulty)

### 2.5 Endpoint para ver el estado del plan del usuario

python
@app.get("/api/plan/status")
async def get_plan_status(user: User = Depends(get_current_user)):
    response = supabase.table("users_plans").select("*").eq("user_id", user.id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404)
    
    plan = response.data["plan"]
    limit = PLAN_LIMITS[plan]["ai_calls"]
    
    return {
        "plan": plan,
        "ai_calls_used": response.data["ai_calls_used"],
        "ai_calls_limit": limit,  # None si es ilimitado
        "worksheets_count": response.data["worksheets_count"],
        "worksheets_limit": PLAN_LIMITS[plan]["worksheets"],
        "period_end": response.data["period_end"]
    }

---

## Fase 3: Pagos con Stripe

### 3.1 Instalación

pip install stripe

### 3.2 Archivo: `payments.py`

python
# backend/payments.py

import stripe
import os
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from auth import get_current_user, User
from fastapi import Depends

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()

# Mapear planes a productos de Stripe (crear estos en el dashboard de Stripe)
STRIPE_PRICE_IDS = {
    "pro":   os.getenv("STRIPE_PRICE_PRO"),    # price_xxxxx
    "elite": os.getenv("STRIPE_PRICE_ELITE"),  # price_xxxxx
}

@router.post("/api/payments/create-session")
async def create_checkout_session(
    plan: str,
    user: User = Depends(get_current_user)
):
    """Crea una sesión de checkout de Stripe."""
    if plan not in STRIPE_PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan inválido")
    
    session = stripe.checkout.Session.create(
        customer_data={"metadata": {"user_id": user.id}},
        mode="subscription",
        line_items=[{"price": STRIPE_PRICE_IDS[plan], "quantity": 1}],
        success_url="https://binary-equalav.vercel.app/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="https://binary-equalav.vercel.app/cancel",
    )
    
    return {"url": session.url}

José Avilés Cárdenas, [01/02/2026 07:32 p. m.]
@router.post("/api/payments/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook que Stripe llama cuando ocurre un evento.
    Aquí actualizamos el plan del usuario en Supabase.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Firma inválida")
    
    if event.type == "checkout.session.completed":
        session = event.data.object
        user_id = session.customer_data.metadata.get("user_id")
        # → Actualizar plan en Supabase
        # supabase.table("users_plans").update({"plan": plan}).eq("user_id", user_id).execute()
    
    return JSONResponse({"ok": True})

### 3.3 Registrar el router en main.py

python
from payments import router as payments_router
app.include_router(payments_router)

---

## Fase 4: Frontend — Mostrar el plan al usuario

### Lo que necesita el frontend:

1. **Componente `<PlanBadge />`** — muestra el plan actual y cuántas llamadas quedan
2. **Componente `<UpgradeModal />`** — se abre cuando el usuario llega al límite (429)
3. **Página `/pricing`** — muestra los tres planes con sus características

### Flujo del usuario:
Usuario llama a IA
    ↓
Frontend hace POST a /api/ai/solve
    ↓
Si 429 → Mostrar UpgradeModal con botón "Upgrade"
    ↓
Botón hace POST a /api/payments/create-session
    ↓
Redirectar a Stripe Checkout
    ↓
Stripe cobra → llama al webhook → plan se actualiza en Supabase
    ↓
Usuario regresa con plan actualizado

---

## Fase 5: Reset mensual automático

Las cuotas se resetean cada mes. Esto puede hacerse de dos formas:

**Opción A — Stripe lo hace por ti:**
Cuando Stripe renueva la suscripción, manda un evento `invoice.paid`. En el webhook, reseteas `ai_calls_used = 0` y actualizas `period_end`.

**Opción B — Cron job en Supabase (Edge Functions):**
sql
-- Supabase Edge Function que corre cada día a medianoche
UPDATE users_plans 
SET ai_calls_used = 0, period_end = now() + INTERVAL '1 month'
WHERE period_end < now();

La Opción A es más limpia porque está sincronizada con el ciclo de pago real.

---

## Resumen de archivos que cambian o se crean

backend/
├── main.py              → Modificar (inyectar middleware en endpoints IA)
├── rate_limiter.py      → NUEVO (control de cuota)
├── payments.py          → NUEVO (Stripe integration)
├── ai_service.py        → Sin cambios
├── auth.py              → Sin cambios
└── worksheets.py        → Sin cambios (pero agregar límite de cantidad)

Supabase:
├── users_plans          → NUEVA tabla
└── usage_log            → NUEVA tabla

Frontend (binary-equalab/src):
├── PlanBadge.tsx        → NUEVO componente
├── UpgradeModal.tsx     → NUEVO componente
└── /pricing             → NUEVA página

---

## Env variables que necesitas agregar

env
# Ya tienes:
KIMI_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=

# Agregar:
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ELITE=price_xxxxx

---

## Orden de implementación recomendado

1. Crear tablas en Supabase (users_plans, usage_log)
2. Escribir rate_limiter.py
3. Modificar main.py para inyectar middleware
4. Testear que el límite funciona (sin Stripe aún)
5. Crear productos y precios en Stripe Dashboard
6. Escribir payments.py
7. Conectar webhook
8. Frontend: PlanBadge + UpgradeModal
9. Frontend: página /pricing
10. Testear flujo completo end-to-end
`

Así puedes validar que el sistema de límites funciona antes de conectar los pagos.
Si quieres, empieza por el paso 1 y 2 y ya puedes testear sin Stripe.