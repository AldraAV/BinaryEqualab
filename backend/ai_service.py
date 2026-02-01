
# backend/ai_service.py

import os
import json
import requests
import asyncio
from typing import List, Dict, Optional, Any

class KimiService:
    """Service to interact with Kimi K2 (Moonshot AI)"""
    
    def __init__(self):
        self.api_key = os.getenv('KIMI_API_KEY', '')
        self.base_url = 'https://api.moonshot.cn/v1'
        self.model = 'moonshot-v1-128k'
        
        if not self.api_key:
            print("⚠️  KIMI_API_KEY no configured")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> str:
        """Send message to Kimi K2 (Async)"""
        
        if not self.api_key:
            return "Error: KIMI_API_KEY not configured in backend."
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        
        payload = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        try:
             # Using asyncio.to_thread for blocking requests if we don't switch to aiohttp
             # For now, simplistic sync wrapper:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: requests.post(
                f'{self.base_url}/chat/completions',
                headers=headers,
                json=payload
            ))
            
            if not response.ok:
                return f"Kimi API Error: {response.status_code} - {response.text}"
            
            data = response.json()
            return data['choices'][0]['message']['content']
            
        except Exception as e:
            return f"Connection Error: {str(e)}"

    async def solve_math_problem(self, problem: str) -> Dict[str, Any]:
        """Solve math problem with step-by-step reasoning"""
        system_prompt = """Eres un asistente matemático experto en álgebra, cálculo y análisis.
        Resuelve el siguiente problema mostrando TODOS los pasos.
        Responde SIEMPRE en formato JSON válido:
        {
          "solution": "Respuesta final LaTeX",
          "steps": ["Paso 1...", "Paso 2..."],
          "reasoning": "Explicación detallada",
          "difficulty": "fácil|medio|difícil",
          "concepts": ["Concepto 1", "Concepto 2"]
        }"""
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': problem}
        ]
        
        content = await self.chat(messages, temperature=0.3)
        try:
            # Clean markdown code blocks if present
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            return json.loads(content)
        except:
            return {
                "solution": "Error parsing AI response",
                "steps": [],
                "reasoning": content, # Return raw content as fallback
                "difficulty": "unknown",
                "concepts": []
            }

    async def explain_concept(self, concept: str, level: str = 'intermediate') -> str:
        """Explain math concept pedagogically"""
        system_prompt = f"""Eres un profesor de matemáticas y física universitario.
        Explica el concepto de forma clara para un estudiante de nivel {level}.
        Usa analogías y ejemplos concretos. Sé conciso pero profundo.
        Responde en Markdown."""
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': f'Explícame: {concept}'}
        ]
        
        return await self.chat(messages, temperature=0.5)

    async def generate_exercises(self, topic: str, count: int = 3, difficulty: str = 'medio') -> List[Dict[str, Any]]:
        """Generate practice exercises"""
        system_prompt = f"""Genera {count} ejercicios de {topic} con dificultad {difficulty}.
        Responde en formato JSON válido:
        [
          {{
            "problem": "Enunciado LaTeX",
            "solution": "Solución LaTeX",
            "steps": ["Paso 1"],
            "concepts": ["Concepto"]
          }}
        ]"""
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': 'Generar ejercicios'}
        ]
        
        content = await self.chat(messages)
        try:
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            return json.loads(content)
        except:
            return []

# Singleton
kimi_service = KimiService()
