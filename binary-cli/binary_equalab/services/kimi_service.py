
# binary-cli/binary_equalab/services/kimi_service.py

import os
import json
import requests
from typing import List, Dict, Optional, Any

class KimiService:
    """Service to interact with Kimi K2 (Moonshot AI) from CLI/Desktop"""
    
    def __init__(self):
        # Allow checking multiple env locations or just env
        self.api_key = os.getenv('KIMI_API_KEY', '')
        self.base_url = 'https://api.moonshot.cn/v1'
        self.model = 'moonshot-v1-128k'
        
        if not self.api_key:
            # Try to read from .env if not loaded (though click/main usually loads it)
            pass
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False
    ) -> Any: # Returns str or iterator
        """Send message to Kimi K2"""
        
        if not self.api_key:
            raise ValueError("KIMI_API_KEY not configured. Set it in your environment.")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        
        payload = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens,
            'stream': stream
        }
        
        response = requests.post(
            f'{self.base_url}/chat/completions',
            headers=headers,
            json=payload,
            stream=stream
        )
        
        if not response.ok:
            raise Exception(f"Kimi API Error: {response.status_code} - {response.text}")
        
        if stream:
            return self._stream_response(response)
        
        data = response.json()
        return data['choices'][0]['message']['content']

    def _stream_response(self, response):
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data = line[6:]
                    if data == '[DONE]':
                        break
                    try:
                        parsed = json.loads(data)
                        content = parsed['choices'][0]['delta'].get('content')
                        if content:
                            yield content
                    except:
                        continue

    def solve_math_problem(self, problem: str, show_steps: bool = True) -> Dict[str, Any]:
        """Solve with steps"""
        system_prompt = f"""Eres un asistente matemático experto.
        Resuelve el problema {'mostrando pasos' if show_steps else 'directamente'}.
        Responde en JSON:
        {{
          "solution": "Respuesta LaTeX",
          "steps": ["Paso 1"],
          "reasoning": "...",
          "concepts": []
        }}"""
        
        messages = [
             {'role': 'system', 'content': system_prompt},
             {'role': 'user', 'content': problem}
        ]
        
        content = self.chat(messages, temperature=0.3)
        try:
             if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
             return json.loads(content)
        except:
             return {"solution": content, "steps": [], "reasoning": "Raw output", "concepts": []}

    def explain_concept(self, concept: str, level: str = 'intermediate') -> str:
        """Explain concept"""
        system_prompt = f"""Explica {concept} para nivel {level}. Usa Markdown."""
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': 'Explícalo'}
        ]
        return self.chat(messages, temperature=0.5)

    def generate_exercises(self, topic: str, count: int = 5, difficulty: str = 'medium') -> List[Dict[str, Any]]:
        """Generate exercises"""
        system_prompt = f"""Genera {count} ejercicios de {topic} ({difficulty}).
        Responde en JSON: [{{ "problem": "...", "solution": "...", "steps": [] }}]"""
        
        messages = [{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': 'Generar'}]
        content = self.chat(messages)
        try:
            if content.startswith("```json"): content = content.replace("```json", "").replace("```","")
            return json.loads(content)
        except:
            return []

# Singleton
kimi_service = KimiService()
