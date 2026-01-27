"""
Binary EquaLab - FastAPI Backend

Main entry point for the API server.
Provides symbolic math computation endpoints and user worksheet management.
"""
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
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

# App lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Binary EquaLab Backend starting...")
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

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
    return {"status": "ok", "service": "binary-equalab-api"}

# ============================================================================
# Auth Endpoints
# ============================================================================

from auth import get_supabase, get_current_user, require_auth, User, AuthRequest, AuthResponse

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(req: AuthRequest):
    """Register a new user."""
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
async def login(req: AuthRequest):
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

# ============================================================================
# Math Endpoints
# ============================================================================

@app.post("/api/simplify", response_model=MathResponse)
async def simplify_expression(req: ExpressionRequest):
    try:
        result = engine.simplify(req.expression)
        latex = engine.to_latex(str(result))  # LaTeX of RESULT, not input
        return MathResponse(result=str(result), latex=str(latex))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/expand", response_model=MathResponse)
async def expand_expression(req: ExpressionRequest):
    try:
        result = engine.expand(req.expression)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/factor", response_model=MathResponse)
async def factor_expression(req: ExpressionRequest):
    try:
        result = engine.factor(req.expression)
        return MathResponse(result=str(result))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/derivative", response_model=MathResponse)
async def compute_derivative(req: DerivativeRequest):
    try:
        result = engine.derivative(req.expression, req.variable, req.order)
        latex = engine.to_latex(str(result))
        return MathResponse(result=str(result), latex=str(latex))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/integral", response_model=MathResponse)
async def compute_integral(req: IntegralRequest):
    try:
        result = engine.integral(
            req.expression, 
            req.variable, 
            req.lower_bound, 
            req.upper_bound
        )
        latex = engine.to_latex(str(result))
        return MathResponse(result=str(result), latex=str(latex))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/solve", response_model=MathResponse)
async def solve_equation(req: ExpressionRequest):
    try:
        result = engine.solve(req.expression, req.variable)
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
        latex = engine.to_latex(str(result))
        return MathResponse(result=str(result), latex=str(latex))
    except Exception as e:
        return MathResponse(result="", success=False, error=str(e))

@app.post("/api/laplace", response_model=MathResponse)
async def compute_laplace(req: ExpressionRequest):
    try:
        result = engine.laplace(req.expression)
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
# Run with: uvicorn main:app --reload
# ============================================================================
