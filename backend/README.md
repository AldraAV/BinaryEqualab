# Binary EquaLab Backend

FastAPI backend for Binary EquaLab CAS calculator.

## Stack
- **Framework:** FastAPI + Uvicorn
- **Math Engine:** SymEngine (C++ native, ~1ms) + SymPy (fallback, timeout 5s)
- **Native Engine:** EquaCore C++ (pybind11) — `sym`, `calculus`, `linalg`, `stats`
- **CAS Backends:** Maxima (Laplace, integrales simbólicas)
- **Auth:** Supabase (JWT + OAuth)
- **Database:** PostgreSQL (via Supabase)

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn main:app --reload
```

## API Endpoints

### Health
- `GET /health` - Health check

### CAS (64 functions)
- `POST /api/cas/evaluate` - Evaluate expression (SymEngine → SymPy cascade)
- `POST /api/cas/simplify` - Simplify
- `POST /api/cas/expand` - Expand
- `POST /api/cas/factor` - Factor
- `POST /api/cas/derivative` - Derivative
- `POST /api/cas/limit` - Limit
- `POST /api/cas/integrate` - Integral
- `POST /api/cas/taylor` - Taylor series

### Bio-Engine
- `POST /api/bio/simulate_pti` - PTI simulation
- `POST /api/bio/simulate_bergman` - Glucose model
- `POST /api/bio/simulate_hh` - Hodgkin-Huxley neuron

### Worksheets (Auth Required)
- `GET /api/worksheets` - List user worksheets
- `POST /api/worksheets` - Create worksheet
- `GET /api/worksheets/{id}` - Get worksheet
- `PUT /api/worksheets/{id}` - Update worksheet
- `DELETE /api/worksheets/{id}` - Delete worksheet
