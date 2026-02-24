"""
Binary EquaLab - FastAPI Backend

Main entry point for the API server.
Provides symbolic math computation endpoints and user worksheet management.
"""
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our math engine (reuse from desktop)
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from src.core.engine import EquaEngine

# Initialize engine
engine = EquaEngine()

# Security
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from security_utils import sanitize_math_expression

# Setup Limiter (100 req/min global per IP)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# App lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("="*50)
    print("🚀 Binary EquaLab Backend v3.0 starting...")
    
    # Check Math Engine
    try:
        test_expr = engine.simplify("x + x")
        print(f"✅ Binary CAS Engine: READY ({test_expr})")
    except Exception as e:
        print(f"❌ Binary CAS Engine: ERROR ({str(e)})")

    # Check Séptima Native Engine
    from routers.septima import HAS_NATIVE_ENGINE
    if HAS_NATIVE_ENGINE:
        print("✅ Séptima Bio-Engine (C++/Native): ACTIVE ⚡")
    else:
        print("⚠️  Séptima Bio-Engine: FALLBACK (Python Mock) 🐢")

    # Check CAS Suite Élite (Maxima)
    from services.maxima_service import maxima
    if os.path.exists(maxima.MAXIMA_PATH):
        print(f"✅ CAS Suite Élite (Maxima): READY at {maxima.MAXIMA_PATH} 🧪")
    else:
        print("⚠️  CAS Suite Élite (Maxima): NOT FOUND (Fourier/Laplace limited) 💨")

    # Check Supabase
    from rate_limiter import supabase
    if supabase:
        print("✅ Supabase Connection: ESTABLISHED")
    else:
        print("⚠️  Supabase Connection: NOT CONFIGURED (Rate limiting disabled)")
    
    print("="*50)
    yield
    # Shutdown
    print("Binary EquaLab Backend shutting down...")

# Create app
app = FastAPI(
    title="Binary EquaLab API",
    description="Symbolic mathematics computation API",
    version="0.1.0",
    lifespan=lifespan
)

# Rate Limiting state & handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Routers ────────────────────────────────────────────────────────────────────
from routers.septima import router as septima_router
app.include_router(septima_router)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Debugging: Allow all origins to fix local CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Pydantic Models
# ============================================================================

class ExpressionRequest(BaseModel):
    expression: str
    variable: Optional[str] = "x"

class DerivativeRequest(BaseModel):
    expression: str
    variable: Optional[str] = "x"
    order: Optional[int] = 1

class IntegralRequest(BaseModel):
    expression: str
    variable: Optional[str] = "x"
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class LimitRequest(BaseModel):
    expression: str
    variable: Optional[str] = "x"
    point: float = 0
    direction: Optional[str] = "+"

class TaylorRequest(BaseModel):
    expression: str
    variable: Optional[str] = "x"
    point: Optional[float] = 0
    order: Optional[int] = 5

class MathResponse(BaseModel):
    result: str
    latex: Optional[str] = None
    success: bool = True
    error: Optional[str] = None

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint and Keep-Alive for Supabase."""
    supabase_status = "not_configured"
    try:
        from auth import get_supabase
        sb = get_supabase()
        # Perform a lightweight query to a known table to keep Supabase active
        # This prevents the free tier project from pausing due to inactivity.
        sb.table("users_plans").select("count", count="exact").limit(1).execute()
        supabase_status = "active"
    except Exception as e:
        print(f"Supabase Keep-Alive Ping Failed: {e}")
        supabase_status = f"inactive/error: {str(e)}"

    return {
        "status": "ok", 
        "service": "binary-equalab-api",
        "supabase": supabase_status
    }

# ============================================================================
# Auth Endpoints
# ============================================================================

from auth import get_supabase, get_current_user, require_auth, User, AuthRequest, AuthResponse

@app.post("/api/auth/signup", response_model=AuthResponse)
@limiter.limit("5/15 minutes")
async def signup(req: AuthRequest, request: Request):
    """Register a new user."""
    # Password strength is validated on frontend, but we could add backend check here via security_utils.validate_password_strength
    try:
        supabase = get_supabase()
        response = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password
        })
        if response.user:
            return AuthResponse(
                access_token=response.session.access_token if response.session else "",
                user=User(id=response.user.id, email=response.user.email or "")
            )
        raise HTTPException(status_code=400, detail="Signup failed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login", response_model=AuthResponse)
@limiter.limit("5/15 minutes")
async def login(req: AuthRequest, request: Request):
    """Login with email and password."""
    try:
        supabase = get_supabase()
        response = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        if response.user and response.session:
            return AuthResponse(
                access_token=response.session.access_token,
                user=User(id=response.user.id, email=response.user.email or "")
            )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/api/auth/me")
async def get_me(user: User = Depends(require_auth)):
    """Get current user info (requires auth)."""
    return {"user": user}

# Include worksheets router
from worksheets import router as worksheets_router
app.include_router(worksheets_router)

# Include payments router
from payments import router as payments_router
app.include_router(payments_router)

# Include CAS router (Suite Élite: Maxima/GiNaC)
from routers.cas import router as cas_router
app.include_router(cas_router)

# Include cron router
from cron import router as cron_router
app.include_router(cron_router)

# Include Séptima router (Biomedical Integration)
# Note: Requires sys.path setup or package install
sys.path.append(os.path.join(os.path.dirname(__file__), 'routers'))
from routers.septima import router as septima_router
app.include_router(septima_router)

# ============================================================================
# Math Endpoints
# ============================================================================

@app.post("/api/simplify", response_model=MathResponse)
async def simplify_expression(req: ExpressionRequest):
    try:
        clean_expr = sanitize_math_expression(req.expression)
        result = engine.simplify(clean_expr)
        latex = engine.expr_to_latex(result)  # Use expr directly, no string conversion
        return MathResponse(result=str(result), latex=latex)
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/expand", response_model=MathResponse)
async def expand_expression(req: ExpressionRequest):
    try:
        clean_expr = sanitize_math_expression(req.expression)
        result = engine.expand(clean_expr)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/factor", response_model=MathResponse)
async def factor_expression(req: ExpressionRequest):
    try:
        clean_expr = sanitize_math_expression(req.expression)
        result = engine.factor(clean_expr)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/derivative", response_model=MathResponse)
async def compute_derivative(req: DerivativeRequest):
    try:
        clean_expr = sanitize_math_expression(req.expression)
        result = engine.derivative(clean_expr, req.variable, req.order)
        latex = engine.expr_to_latex(result)
        return MathResponse(result=str(result), latex=latex)
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/integral", response_model=MathResponse)
async def compute_integral(req: IntegralRequest):
    try:
        clean_expr = sanitize_math_expression(req.expression)
        result = engine.integral(
            clean_expr, 
            req.variable, 
            req.lower_bound, 
            req.upper_bound
        )
        latex = engine.expr_to_latex(result)
        return MathResponse(result=str(result), latex=latex)
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/solve", response_model=MathResponse)
async def solve_equation(req: ExpressionRequest):
    try:
        clean_expr = sanitize_math_expression(req.expression)
        result = engine.solve(clean_expr, req.variable)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/limit", response_model=MathResponse)
async def compute_limit(req: LimitRequest):
    try:
        result = engine.limit(req.expression, req.variable, req.point, req.direction)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/taylor", response_model=MathResponse)
async def compute_taylor(req: TaylorRequest):
    try:
        result = engine.taylor(req.expression, req.variable, req.point, req.order)
        latex = engine.expr_to_latex(result)
        return MathResponse(result=str(result), latex=latex)
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/laplace", response_model=MathResponse)
async def compute_laplace(req: ExpressionRequest):
    try:
        result = engine.laplace(req.expression)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/fourier", response_model=MathResponse)
async def compute_fourier(req: ExpressionRequest):
    try:
        result = engine.fourier(req.expression)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/latex", response_model=MathResponse)
async def to_latex(req: ExpressionRequest):
    try:
        result = engine.to_latex(req.expression)
        return MathResponse(result=str(result), latex=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

# ============================================================================
# ============================================================================
# AI Endpoints (Kimi K2)
# ============================================================================

# ============================================================================
# AI Endpoints (Kimi K2)
# ============================================================================

from ai_service import ai_engine
from rate_limiter import check_ai_quota, PLAN_LIMITS, supabase

# --- System Status ---
@app.get("/")
async def read_root():
    return {
        "status": "online",
        "service": "Binary EquaLab API", 
        "version": "3.0.0b1", 
        "backend": "Python/FastAPI + Nerdamer"
    }

# --- Plan Status Endpoint ---
@app.get("/api/plan/status")
async def get_plan_status(user: User = Depends(get_current_user)):
    try:
        response = supabase.table("users_plans").select("*").eq("user_id", user.id).single().execute()
        if not response.data:
            # Auto-provision 'free' plan if missing
            new_plan = {
                "user_id": user.id,
                "plan": "free",
                "ai_calls_used": 0,
                "period_end": "now() + interval '1 month'" 
            }
            insert_res = supabase.table("users_plans").insert(new_plan).execute()
            
            if insert_res.data:
                data = insert_res.data[0]
            else:
                 # Fallback if insert fails
                return {
                    "plan": "free",
                    "ai_calls_used": 0,
                    "ai_calls_limit": PLAN_LIMITS["free"]["ai_calls"],
                    "worksheets_count": 0,
                    "worksheets_limit": PLAN_LIMITS["free"]["worksheets"]
                }
        else:
            data = response.data
        plan = data.get("plan", "free")
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        
        return {
            "plan": plan,
            "ai_calls_used": data.get("ai_calls_used", 0),
            "ai_calls_limit": limits["ai_calls"],
            "worksheets_count": data.get("worksheets_count", 0),
            "worksheets_limit": limits["worksheets"],
            "period_end": data.get("period_end")
        }
    except Exception as e:
        # Log error but return fallback plan structure with all keys to avoid frontend crashes
        print(f"Plan Status Error: {e}")
        return {
            "plan": "free",
            "ai_calls_used": 0,
            "ai_calls_limit": 20,
            "worksheets_count": 0,
            "worksheets_limit": 5,
            "period_end": datetime.now().isoformat(),
            "error": str(e)
        }

class AIRequest(BaseModel):
    query: str

class AIExercisesRequest(BaseModel):
    topic: str
    count: Optional[int] = 3
    difficulty: Optional[str] = "medio"

@app.post("/api/ai/solve")
async def ai_solve(req: AIRequest, user: User = Depends(check_ai_quota)):
    """Solve math problem with AI reasoning."""
    return await ai_engine.solve_math_problem(req.query)

@app.post("/api/ai/explain")
async def ai_explain(req: AIRequest, user: User = Depends(check_ai_quota)):
    """Explain math concept."""
    result = await ai_engine.explain_concept(req.query)
    return {"explanation": result}

@app.post("/api/ai/exercises")
async def ai_exercises(req: AIExercisesRequest, user: User = Depends(check_ai_quota)):
    """Generate practice exercises."""
    return await ai_engine.generate_exercises(req.topic, req.count, req.difficulty)

# ============================================================================
# Run with: uvicorn main:app --reload
# ============================================================================
