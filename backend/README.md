# Binary EquaLab Backend

FastAPI backend for Binary EquaLab CAS calculator.

## Stack
- **Framework:** FastAPI
- **Auth:** Supabase (JWT + OAuth)
- **Math Engine:** SymPy
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

### Math (Symbolic)
- `POST /api/simplify` - Simplify expression
- `POST /api/expand` - Expand expression
- `POST /api/factor` - Factor expression
- `POST /api/derivative` - Compute derivative
- `POST /api/integral` - Compute integral
- `POST /api/solve` - Solve equation
- `POST /api/latex` - Convert to LaTeX

### Worksheets (Auth Required)
- `GET /api/worksheets` - List user worksheets
- `POST /api/worksheets` - Create worksheet
- `GET /api/worksheets/{id}` - Get worksheet
- `PUT /api/worksheets/{id}` - Update worksheet
- `DELETE /api/worksheets/{id}` - Delete worksheet
