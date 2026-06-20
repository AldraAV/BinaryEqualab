import os
from celery import Celery

# URL del broker Redis local
REDIS_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")

# Instancia de Celery
celery_app = Celery(
    "binary_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # El task result caduca en 1 hora para no saturar memoria
    result_expires=3600,
)

# Aquí importaremos o definiremos las tareas asíncronas
@celery_app.task(name="binary_worker.evaluate_expression")
def evaluate_expression_task(expression: str, variables: dict = None):
    """
    Tarea de ejemplo o placeholder que luego conectaremos con SymPy.
    """
    import sympy as sp
    try:
        from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
        transformations = standard_transformations + (implicit_multiplication_application, convert_xor)
        
        parsed = parse_expr(expression, transformations=transformations)
        simplified = sp.simplify(parsed)
        
        return {
            "success": True,
            "result": str(simplified),
            "latex": sp.latex(simplified)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
