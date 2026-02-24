"""
Binary EquaLab - AIExplainer
Orquestador de narrativa clínica basado en patrones Aldraverse (Candidate Isolation).
"""
import os
import json
from ai_service import GroqService, KimiService

class AIExplainer:
    def __init__(self):
        self.groq = GroqService()
        self.kimi = KimiService()

    async def generate_explanation(self, patient_data, simulation_results, mode="student"):
        """
        Genera una explicación narrativa del estado del paciente y los resultados.
        Implementa 'Candidate Isolation' para asegurar coherencia.
        """
        prompt = self._build_clinical_prompt(patient_data, simulation_results, mode)
        
        # En una versión avanzada, lanzaríamos múltiples candidatos y puntuaríamos.
        # Por ahora, usamos el modelo de mayor fidelidad (Groq Llama 3.3).
        response = await self.groq.chat([
            {"role": "system", "content": "Eres Séptima, una experta en hematología y modelos matemáticos bio-médicos. Tu tono es profesional, empático y educativo."},
            {"role": "user", "content": prompt}
        ])
        
        return response

    def _build_clinical_prompt(self, data, results, mode):
        p_final = results.get('p_final', 0)
        p_init = results.get('p_initial', 0)
        days = results.get('days', 30)
        
        context = f"""
        Paciente: Niño, 12 años (Caso José).
        Condición: Púrpura Trombocitopénica Inmune (PTI).
        Simulación: {days} días.
        Plaquetas iniciales: {p_init:,}/uL.
        Plaquetas finales: {p_final:,}/uL.
        Tratamiento: {data.get('treatment_name', 'Ninguno')}.
        """
        
        if mode == "family":
            return f"{context}\nExplica estos resultados a la familia de forma sencilla pero rigurosa. Enfócate en la seguridad y los próximos pasos."
        elif mode == "student":
            return f"{context}\nExplica la fisiopatología detrás de estos números. Menciona la tasa de destrucción mediada por anticuerpos y por qué el tratamiento funcionó o falló."
        
        return f"{context}\nProporciona un análisis clínico detallado de la simulación."
