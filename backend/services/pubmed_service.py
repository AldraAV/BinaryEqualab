"""
PubMed Data Engine — Servicio async para consulta de evidencia médica.
Usa la API pública E-Utilities de NCBI (eutils.ncbi.nlm.nih.gov).

No requiere API key para <3 req/s. Con API key sube a 10 req/s.
"""

import asyncio
import time
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional
from dataclasses import dataclass, field

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

# ─── Config ─────────────────────────────────────────────────────────────────────

EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
ESEARCH_URL = f"{EUTILS_BASE}/esearch.fcgi"
EFETCH_URL  = f"{EUTILS_BASE}/efetch.fcgi"
CACHE_TTL   = 1800  # 30 minutes

# ─── Cache ──────────────────────────────────────────────────────────────────────

@dataclass
class CacheEntry:
    data: list
    timestamp: float

class PubMedService:
    """Async PubMed search and abstract fetcher with in-memory cache."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self._cache: Dict[str, CacheEntry] = {}

    def _cache_key(self, query: str, max_results: int) -> str:
        return f"{query}::{max_results}"

    def _is_cached(self, key: str) -> bool:
        if key not in self._cache:
            return False
        return (time.time() - self._cache[key].timestamp) < CACHE_TTL

    async def search(self, query: str, max_results: int = 5) -> List[str]:
        """Search PubMed and return list of PMIDs."""
        if not HAS_HTTPX:
            return []

        params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json",
            "sort": "relevance",
        }
        if self.api_key:
            params["api_key"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(ESEARCH_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                return data.get("esearchresult", {}).get("idlist", [])
        except Exception as e:
            print(f"PubMed search error: {e}")
            return []

    async def fetch_abstracts(self, pmids: List[str]) -> List[Dict]:
        """Fetch article details (title, authors, abstract) for given PMIDs."""
        if not pmids or not HAS_HTTPX:
            return []

        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml",
            "rettype": "abstract",
        }
        if self.api_key:
            params["api_key"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(EFETCH_URL, params=params)
                resp.raise_for_status()
                return self._parse_xml(resp.text)
        except Exception as e:
            print(f"PubMed fetch error: {e}")
            return []

    def _parse_xml(self, xml_text: str) -> List[Dict]:
        """Parse PubMed XML response into structured dicts."""
        articles = []
        try:
            root = ET.fromstring(xml_text)
            for article_el in root.findall(".//PubmedArticle"):
                pmid_el = article_el.find(".//PMID")
                title_el = article_el.find(".//ArticleTitle")
                abstract_el = article_el.find(".//Abstract/AbstractText")
                journal_el = article_el.find(".//Journal/Title")
                year_el = article_el.find(".//PubDate/Year")

                # Authors
                authors = []
                for author_el in article_el.findall(".//Author"):
                    last = author_el.findtext("LastName", "")
                    first = author_el.findtext("ForeName", "")
                    if last:
                        authors.append(f"{last} {first}".strip())

                articles.append({
                    "pmid": pmid_el.text if pmid_el is not None else "",
                    "title": title_el.text if title_el is not None else "Sin título",
                    "abstract": abstract_el.text if abstract_el is not None else "",
                    "journal": journal_el.text if journal_el is not None else "",
                    "year": year_el.text if year_el is not None else "",
                    "authors": authors[:3],  # First 3 authors
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid_el.text}/" if pmid_el is not None else "",
                })
        except ET.ParseError as e:
            print(f"PubMed XML parse error: {e}")
        return articles

    async def get_evidence(self, disease: str, treatment: str, max_results: int = 3) -> List[Dict]:
        """
        High-level helper: search for evidence on a disease+treatment pair.
        Returns cached results if available.
        """
        query = f"{disease} {treatment} treatment children"
        cache_key = self._cache_key(query, max_results)

        if self._is_cached(cache_key):
            return self._cache[cache_key].data

        pmids = await self.search(query, max_results)
        if not pmids:
            return []

        articles = await self.fetch_abstracts(pmids)
        self._cache[cache_key] = CacheEntry(data=articles, timestamp=time.time())
        return articles

    def format_for_prompt(self, articles: List[Dict], max_chars: int = 1500) -> str:
        """Format articles as a concise text block for LLM prompt injection."""
        if not articles:
            return ""

        lines = ["--- EVIDENCIA PUBMED (papers recientes) ---"]
        total = 0
        for a in articles:
            abstract_short = (a["abstract"] or "")[:300]
            entry = (
                f"• PMID {a['pmid']} ({a['year']}): {a['title']}\n"
                f"  {', '.join(a['authors'])} — {a['journal']}\n"
                f"  {abstract_short}{'...' if len(a.get('abstract', '')) > 300 else ''}\n"
            )
            if total + len(entry) > max_chars:
                break
            lines.append(entry)
            total += len(entry)

        lines.append("--- FIN EVIDENCIA ---")
        return "\n".join(lines)


# Singleton
pubmed = PubMedService()
