
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

class GroqService:
    """Service to interact with Groq (Llama 3 / Mixtral)"""
    
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY', '')
        self.base_url = 'https://api.groq.com/openai/v1'
        self.model = 'llama-3.3-70b-versatile' # High performance model
        
        if not self.api_key:
            print("⚠️  GROQ_API_KEY not configured")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.5,
        max_tokens: int = 4096
    ) -> str:
        """Send message to Groq (Async)"""
        
        if not self.api_key:
            return "Error: GROQ_API_KEY not configured."
        
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
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: requests.post(
                f'{self.base_url}/chat/completions',
                headers=headers,
                json=payload,
                timeout=10 # Faster timeout for Groq to allow faster fallback
            ))
            
            if not response.ok:
                return f"Groq API Error: {response.status_code}"
            
            data = response.json()
            return data['choices'][0]['message']['content']
            
        except Exception as e:
            return f"Error: {str(e)}"

class MultiAIEngine:
    """Orchestrator that handles multiple providers with fallback logic"""
    
    def __init__(self):
        self.groq = GroqService()
        self.kimi = KimiService()
        
    async def chat_with_fallback(self, messages: List[Dict[str, str]], temperature: float = 0.5) -> str:
        """Try Groq first, then Kimi if Groq fails or is not configured"""
        
        # 1. Try Groq
        if self.groq.api_key:
            result = await self.groq.chat(messages, temperature=temperature)
            if not result.startswith("Error"):
                return result
            print(f"🔄 Groq failed, falling back to Kimi. Reason: {result}")
            
        # 2. Try Kimi
        if self.kimi.api_key:
            return await self.kimi.chat(messages, temperature=temperature)
            
        return "Error: No AI provider (Groq/Kimi) is properly configured."

    async def solve_math_problem(self, problem: str) -> Dict[str, Any]:
        """Solve math problem with step-by-step reasoning (Multi-LLM)"""
        system_prompt = """Eres un asistente matemático experto en álgebra, cálculo y análisis de la Suite Aurora.
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
        
        content = await self.chat_with_fallback(messages, temperature=0.2)
        try:
            # Clean markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            return json.loads(content.strip())
        except:
            return {
                "solution": "AI Fallback Result",
                "steps": [],
                "reasoning": content,
                "difficulty": "unknown",
                "concepts": []
            }

    async def explain_concept(self, concept: str, level: str = 'intermediate') -> str:
        """Explain math concept pedagogically (Multi-LLM)"""
        system_prompt = f"""Eres un profesor de matemáticas y física universitario de la Suite Aurora.
        Explica el concepto de forma clara para un estudiante de nivel {level}.
        Usa analogías y ejemplos concretos. Sé conciso pero profundo.
        Usa LaTeX para las fórmulas. Responde en Markdown."""
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': f'Explícame paso a paso el concepto de: {concept}'}
        ]
        
        return await self.chat_with_fallback(messages, temperature=0.6)

    async def generate_exercises(self, topic: str, count: int = 3, difficulty: str = 'medio') -> List[Dict[str, Any]]:
        """Generate practice exercises (Multi-LLM)"""
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
        
        content = await self.chat_with_fallback(messages)
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            return json.loads(content.strip())
        except:
            return []

# Singletons for export
ai_engine = MultiAIEngine()
kimi_service = KimiService() # For legacy compatibility
