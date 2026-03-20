"""
Router de Datos Médicos — Exposición HTTP de búsquedas PubMed para el frontend.
"""

from fastapi import APIRouter, Query
from typing import Optional

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from services.pubmed_service import pubmed

router = APIRouter(prefix="/api/septima/pubmed", tags=["Medical Data Engine"])


@router.get("/search")
async def search_pubmed(
    q: str = Query(..., description="Consulta de búsqueda médica"),
    max_results: int = Query(default=5, le=20, description="Máximo de resultados")
):
    """Busca papers en PubMed por relevancia."""
    pmids = await pubmed.search(q, max_results)
    if not pmids:
        return {"results": [], "query": q, "count": 0}

    articles = await pubmed.fetch_abstracts(pmids)
    return {
        "results": articles,
        "query": q,
        "count": len(articles),
    }


@router.get("/{pmid}")
async def get_article(pmid: str):
    """Obtiene el abstract de un paper específico por PMID."""
    articles = await pubmed.fetch_abstracts([pmid])
    if not articles:
        return {"error": f"PMID {pmid} no encontrado"}
    return articles[0]


@router.get("/evidence/{disease}")
async def get_evidence(
    disease: str,
    treatment: Optional[str] = Query(default=None, description="Tratamiento específico")
):
    """Busca evidencia médica para un par enfermedad/tratamiento."""
    articles = await pubmed.get_evidence(disease, treatment or "", max_results=5)
    return {
        "disease": disease,
        "treatment": treatment,
        "evidence": articles,
        "count": len(articles),
    }
