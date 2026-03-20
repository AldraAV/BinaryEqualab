"""
Binary EquaLab - AIExplainer
Orquestador "Consorcio Médico" con 3 Agentes RAG interactuando asincrónicamente.
Ahora con inyección de evidencia PubMed (Data Engine).
"""
import os
import json
import asyncio
from typing import Dict, Any
from ai_service import GroqService, KimiService
from services.pubmed_service import pubmed

class AIExplainer:
    def __init__(self):
        self.groq = GroqService()
        self.kimi = KimiService()

    async def generate_explanation(self, patient_data: Dict[str, Any], simulation_results: Dict[str, Any], mode: str = "student") -> dict:
        """
        Orquesta una mesa de debate clínico (Consorcio Médico) en paralelo.
        """
        p_final = simulation_results.get('p_final', 0)
        p_init = simulation_results.get('p_initial', 0)
        days = simulation_results.get('days', 30)
        treatment = patient_data.get('treatment_name', 'Ninguno')
        is_dead = patient_data.get('is_dead', False)
        has_cushing = patient_data.get('has_cushing', False)
        has_thrombocytosis = patient_data.get('has_thrombocytosis', False)
        dose_mg = patient_data.get('dose_mg', 0)
        
        context_base = f"""
        Caso Clínico: José (Niño de 12 años).
        Diagnóstico: Púrpura Trombocitopénica Inmune (PTI).
        Tratamiento analizado: {treatment} (Dosis: {dose_mg} mg).
        Evolución termodinámica {days} días.
        Plaquetas iniciales: {p_init:,.0f}/uL.
        Plaquetas simuladas al final del mes: {p_final:,.0f}/uL.
        """

        if is_dead:
            context_base += "\n\n[¡ALERTA CLÍNICA FATAL!]: Las plaquetas del niño cayeron por debajo del umbral de <10,000/uL. El simulador matemático declara que el paciente sufrió una Hemorragia Intracraneal mortal. Abordar el fracaso absoluto de esta decisión."
        
        if has_thrombocytosis:
            context_base += "\n\n[¡ALERTA TROMBÓTICA CRÍTICA!]: La intervención provocó una Trombocitosis Reactiva severa (>600,000/uL). La sangre se espesó masivamente, resultando en coágulos, accidente cerebrovascular (ACV) y potencial colapso sistémico. Abordar urgentemente esta catástrofe iatrogénica."
            
        if has_cushing:
            context_base += "\n\n[¡ALERTA IATROGÉNICA!]: La dosis sostenida de Prednisona fue >60mg/día por más de 14 días. El paciente ha desarrollado claros signos de Síndrome de Cushing e Inmunosupresión celular peligrosa, aunque las plaquetas parezcan normales. Abordar esta mala praxis."

        # RAG: Inyectar evidencia PubMed real
        try:
            evidence = await pubmed.get_evidence(
                "immune thrombocytopenia", treatment, max_results=3
            )
            evidence_block = pubmed.format_for_prompt(evidence)
            if evidence_block:
                context_base += f"\n\n{evidence_block}"
        except Exception as e:
            print(f"PubMed RAG warning (non-blocking): {e}")

        # 1. Ejecución paralela de especialistas de 1er nivel 
        hematologist_task = self._hematologist_agent(context_base, mode)
        pharmacologist_task = self._pharmacologist_agent(context_base, treatment, mode)
        
        hematologist_response, pharmacologist_response = await asyncio.gather(
            hematologist_task, pharmacologist_task
        )

        # 2. Orquestación jerárquica: El Director Médico sintetiza a partir del debate
        director_response = await self._chief_medical_agent(
            context_base, hematologist_response, pharmacologist_response, mode
        )

        return {
            "hematologist": hematologist_response,
            "pharmacologist": pharmacologist_response,
            "director": director_response
        }

    async def _hematologist_agent(self, context: str, mode: str) -> str:
        prompt = f"""
        {context}
        Como experto Hematólogo, analiza brevemente (máx 150 palabras) el efecto cruzado entre plaquetas y auto-anticuerpos.
        Menciona la letalidad de los macrófagos. Concéntrate en la respuesta celular matemática mostrada.
        """
        try:
            return await self.groq.chat([
                {"role": "system", "content": "Eres un Hematólogo Pediatra de clase mundial (Experto en Bio-Matemáticas de fluidos). Evita redundancias, vas directo al grano científico."},
                {"role": "user", "content": prompt}
            ])
        except Exception as e:
            return f"Error en hematología: {str(e)}"

    async def _pharmacologist_agent(self, context: str, treatment: str, mode: str) -> str:
        if mode == "family":
            tone = "Explica esto de forma que una madre o padre entienda los riesgos y beneficios."
        else:
            tone = "Justifica con mecanismos farmacodinámicos el resultado (corticoides vs IgGs vs asplenia)."

        prompt = f"""
        {context}
        Como experto Farmacólogo Clínico y Cirujano, evalúa la decisión del tratamiento: {treatment}.
        Menciona los efectos adversos o el peligro subyacente de esta ruta y por qué funcionó o no matemáticamente.
        {tone}
        (Máximo 150 palabras).
        """
        try:
            return await self.groq.chat([
                {"role": "system", "content": "Eres un Farmacólogo nivel senior. Usas un razonamiento basado en guidelines PDR o TOON simulado. Sé incisivo sobre las consecuencias orgánicas."},
                {"role": "user", "content": prompt}
            ])
        except Exception as e:
            return f"Error en farmacología: {str(e)}"

    async def _chief_medical_agent(self, context: str, heme_report: str, pharm_report: str, mode: str) -> str:
        if mode == "family":
            target = "a la familia de José (empático, transmite confianza sobre la decisión)."
        else:
            target = "a un interno de medicina (enseñanza sobre el pronóstico general a largo plazo)."

        prompt = f"""
        {context}
        
        --- OPINIÓN HEMATÓLOGO ---
        {heme_report}
        
        --- OPINIÓN FARMACÓLOGO ---
        {pharm_report}
        
        Como Jefe de Medicina Interna del hospital, lee a tus dos especialistas y emite tu Veredicto Final / Plan de Acción (resolutivo).
        Háblale directamente {target}
        (Máximo 150 palabras).
        """
        try:
            return await self.groq.chat([
                {"role": "system", "content": "Eres el Jefe del Consorcio Médico de Séptima. Tu rol es amalgamar y liderar. Tu tono infunde un liderazgo humanista incomparable y de altísimo nivel resolutivo."},
                {"role": "user", "content": prompt}
            ])
        except Exception as e:
            return f"Error en síntesis directiva: {str(e)}"
