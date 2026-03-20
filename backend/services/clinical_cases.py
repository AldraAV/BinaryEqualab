"""
Séptima - Clinical Cases Service
Casos clínicos interactivos pre-configurados para simulación educativa PTI.

Cada caso incluye: datos del paciente, parámetros del modelo, opciones de
tratamiento, y criterios de evaluación para el estudiante.
"""

from typing import List, Dict, Any


# ─── Banco de Casos Clínicos PTI ─────────────────────────────────────────────────

PTI_CASES: List[Dict[str, Any]] = [
    {
        "id": "pti_pediatric_acute",
        "title": "PTI Aguda Pediátrica",
        "difficulty": "beginner",
        "patient": {
            "name": "José M.",
            "age": 12,
            "sex": "M",
            "weight_kg": 40,
            "history": (
                "Niño de 12 años previamente sano. Madre nota aparición súbita de "
                "petequias en extremidades y equimosis fácil hace 3 días. "
                "Antecedente de infección viral (resfriado común) hace 2 semanas. "
                "Sin fiebre, sin hepatoesplenomegalia."
            ),
            "labs": {
                "platelets": 8000,
                "hemoglobin": 13.2,
                "wbc": 7500,
                "peripheral_smear": "Plaquetas gigantes aisladas. Sin blastos."
            }
        },
        "simulation_params": {
            "y0": [8000, 1.2],
            "params": {
                "production_rate": 30000,
                "destruction_rate": 60000,
                "antibody_production": 0.18,
                "antibody_half_life": 21,
                "treatment": 0,
                "dose_mg": 0
            }
        },
        "treatment_options": [
            {
                "id": 0,
                "name": "Observación",
                "description": "Monitoreo sin intervención. Adecuado si PLT >20k y sin sangrado activo.",
                "is_correct": False,
                "feedback": "❌ Con 8,000 PLT/μL hay riesgo significativo de hemorragia intracraneal. Se requiere tratamiento."
            },
            {
                "id": 1,
                "name": "Prednisona 1mg/kg/día (40mg)",
                "description": "Corticosteroide oral. Primera línea en PTI pediátrica.",
                "is_correct": True,
                "params_override": {"treatment": 1, "dose_mg": 40},
                "feedback": "✅ Correcto. Prednisona 1mg/kg es primera línea. Respuesta esperada en 3-7 días."
            },
            {
                "id": 2,
                "name": "IVIG 1g/kg × 2 días",
                "description": "Inmunoglobulina IV. Respuesta rápida (24-48h).",
                "is_correct": True,
                "params_override": {"treatment": 2, "ivig_doses": 4},
                "feedback": "✅ Aceptable. IVIG da respuesta más rápida que prednisona. Ideal si hay sangrado activo."
            },
            {
                "id": 3,
                "name": "Esplenectomía",
                "description": "Extirpar el bazo quirúrgicamente.",
                "is_correct": False,
                "feedback": "❌ La esplenectomía NO es primera línea en PTI aguda pediátrica. Se reserva para PTI crónica refractaria (>12 meses)."
            }
        ],
        "learning_objectives": [
            "Reconocer la presentación típica de PTI aguda pediátrica post-viral",
            "Identificar el umbral de tratamiento (PLT <20,000 con sangrado o <10,000)",
            "Seleccionar primera línea de tratamiento correcta",
            "Comprender por qué la esplenectomía no es apropiada en PTI aguda"
        ],
        "expected_outcome": {
            "with_treatment": "PLT >50,000 en 7-14 días. Remisión en 80% de PTI aguda pediátrica.",
            "without_treatment": "Riesgo de hemorragia intracraneal espontánea (~8% diario con 8k PLT)."
        }
    },
    {
        "id": "pti_adult_chronic",
        "title": "PTI Crónica Refractaria en Adulta",
        "difficulty": "intermediate",
        "patient": {
            "name": "María L.",
            "age": 34,
            "sex": "F",
            "weight_kg": 65,
            "history": (
                "Mujer de 34 años con diagnóstico de PTI hace 18 meses. "
                "Ha recibido 3 ciclos de prednisona con respuesta transitoria — "
                "plaquetas suben a 100k pero recaen a 25k al suspender. "
                "Última biometría: 22,000 PLT/μL. Menstruaciones prolongadas (7 días). "
                "Petequias en antebrazos. Desea embarazo en el futuro."
            ),
            "labs": {
                "platelets": 22000,
                "hemoglobin": 10.8,
                "wbc": 6200,
                "reticulocytes": "2.1%",
                "ferritin": 18,
                "peripheral_smear": "Megatrombocitos. Anemia microcítica (deficiencia hierro por sangrado)."
            }
        },
        "simulation_params": {
            "y0": [22000, 2.5],
            "params": {
                "production_rate": 30000,
                "destruction_rate": 60000,
                "antibody_production": 0.20,
                "antibody_half_life": 21,
                "treatment": 0,
                "dose_mg": 0
            }
        },
        "treatment_options": [
            {
                "id": 0,
                "name": "Continuar observación",
                "description": "Monitoreo sin cambio de tratamiento.",
                "is_correct": False,
                "feedback": "❌ Con 22k PLT y sangrado menstrual activo + anemia ferropénica, necesita intervención."
            },
            {
                "id": 1,
                "name": "Prednisona 60mg (4° ciclo)",
                "description": "Repetir corticosteroide.",
                "is_correct": False,
                "params_override": {"treatment": 1, "dose_mg": 60},
                "feedback": "❌ Ya falló 3 veces. Repetir prednisona solo causa efectos adversos sin remisión sostenida. Riesgo de Cushing."
            },
            {
                "id": 2,
                "name": "Rituximab (anti-CD20)",
                "description": "Anticuerpo monoclonal que depleta linfocitos B productores de autoanticuerpos.",
                "is_correct": True,
                "params_override": {"treatment": 1, "dose_mg": 30, "antibody_production": 0.05},
                "feedback": "✅ Correcto. Rituximab es segunda línea para PTI crónica refractaria. Reduce producción de Ab a largo plazo."
            },
            {
                "id": 3,
                "name": "Esplenectomía",
                "description": "Opción quirúrgica definitiva.",
                "is_correct": True,
                "params_override": {"treatment": 3, "splenectomy_success": 0.85},
                "feedback": "✅ Aceptable. Esplenectomía tiene 60-80% remisión. Pero paciente desea embarazo — considerar Rituximab primero."
            }
        ],
        "learning_objectives": [
            "Reconocer PTI crónica refractaria (>12 meses, fallo a corticoides)",
            "Entender por qué repetir prednisona es inefectivo y peligroso",
            "Considerar opciones de segunda línea (rituximab, esplenectomía, agonistas TPO)",
            "Valorar contexto del paciente (deseo de embarazo) en la decisión terapéutica"
        ],
        "expected_outcome": {
            "with_treatment": "Rituximab: remisión en 40-60% a 6 meses. Esplenectomía: 70-80% inmediata.",
            "without_treatment": "PLT estable ~22k pero riesgo hemorrágico constante + anemia progresiva."
        }
    },
    {
        "id": "pti_emergency",
        "title": "Emergencia Hemorrágica — PTI con Hemorragia Activa",
        "difficulty": "advanced",
        "patient": {
            "name": "Roberto A.",
            "age": 67,
            "sex": "M",
            "weight_kg": 78,
            "history": (
                "Hombre de 67 años con PTI crónica conocida. Llega a urgencias con "
                "epistaxis profusa bilateral que no cede con taponamiento anterior. "
                "Hematuria macroscópica. Equimosis extensas en tronco. "
                "Presión arterial 160/95 (hipertenso no controlado). "
                "Toma aspirina 100mg diario por antecedente cardiovascular. "
                "Última biometría (hace 1 hora): 3,000 PLT/μL."
            ),
            "labs": {
                "platelets": 3000,
                "hemoglobin": 8.5,
                "wbc": 9800,
                "inr": 1.1,
                "creatinine": 1.4,
                "blood_pressure": "160/95",
                "peripheral_smear": "Trombocitopenia severa. Sin esquistocitos."
            }
        },
        "simulation_params": {
            "y0": [3000, 3.0],
            "params": {
                "production_rate": 30000,
                "destruction_rate": 60000,
                "antibody_production": 0.22,
                "antibody_half_life": 21,
                "treatment": 0,
                "dose_mg": 0
            }
        },
        "treatment_options": [
            {
                "id": 0,
                "name": "Solo prednisona oral 60mg",
                "description": "Corticosteroide oral estándar.",
                "is_correct": False,
                "params_override": {"treatment": 1, "dose_mg": 60},
                "feedback": "❌ Prednisona tarda 3-7 días. Con 3,000 PLT y sangrado activo, el paciente puede morir antes de que haga efecto."
            },
            {
                "id": 1,
                "name": "IVIG 1g/kg STAT + Metilprednisolona IV 1g",
                "description": "Combinación de emergencia: IVIG para respuesta rápida + pulsos de esteroides IV.",
                "is_correct": True,
                "params_override": {"treatment": 2, "ivig_doses": 5, "antibody_production": 0.12},
                "feedback": "✅ Correcto. Manejo de emergencia: IVIG para elevar PLT en 24-48h + esteroides IV. Suspender aspirina inmediatamente."
            },
            {
                "id": 2,
                "name": "Transfusión de plaquetas",
                "description": "Concentrado plaquetario para elevar recuento rápidamente.",
                "is_correct": True,
                "params_override": {"treatment": 2, "ivig_doses": 3},
                "feedback": "⚠️ Parcialmente correcto. Transfusión de plaquetas en PTI tiene efecto MUY corto (horas — se destruyen igual). Pero en emergencia hemorrágica se justifica como medida temporal mientras IVIG hace efecto."
            },
            {
                "id": 3,
                "name": "Esplenectomía de emergencia",
                "description": "Cirugía de urgencia para remover el bazo.",
                "is_correct": False,
                "feedback": "❌ Con 3,000 PLT, la cirugía es extremadamente riesgosa (hemorragia intraoperatoria). No se opera con PLT <50k sin preparación."
            }
        ],
        "learning_objectives": [
            "Reconocer emergencia hemorrágica en PTI (PLT <5k + sangrado activo)",
            "Entender que prednisona oral NO es suficiente en emergencia",
            "Conocer el protocolo de emergencia (IVIG + esteroides IV + suspender antiagregantes)",
            "Saber que transfusión de plaquetas en PTI es temporal pero justificable en emergencia",
            "Identificar factores agravantes (HTA, aspirina, edad avanzada)"
        ],
        "expected_outcome": {
            "with_treatment": "IVIG: PLT >20k en 24-48h. Estabilización en 3-5 días.",
            "without_treatment": "Riesgo de hemorragia intracraneal fatal: ~15% diario. Mortalidad >90% a 10 días."
        }
    }
]


def get_all_cases() -> List[Dict]:
    """Returns summary of all available cases."""
    return [{
        "id": c["id"],
        "title": c["title"],
        "difficulty": c["difficulty"],
        "patient_name": c["patient"]["name"],
        "patient_age": c["patient"]["age"],
        "initial_platelets": c["patient"]["labs"]["platelets"],
    } for c in PTI_CASES]


def get_case_by_id(case_id: str) -> Dict:
    """Returns full case details by ID."""
    for c in PTI_CASES:
        if c["id"] == case_id:
            return c
    return {}


def evaluate_choice(case_id: str, treatment_id: int) -> Dict:
    """Evaluates the student's treatment choice for a case."""
    case = get_case_by_id(case_id)
    if not case:
        return {"error": f"Case '{case_id}' not found"}
    
    for opt in case["treatment_options"]:
        if opt["id"] == treatment_id:
            return {
                "case_id": case_id,
                "chosen_treatment": opt["name"],
                "is_correct": opt["is_correct"],
                "feedback": opt["feedback"],
                "params_override": opt.get("params_override", {}),
                "learning_objectives": case["learning_objectives"],
                "expected_outcome": case["expected_outcome"]
            }
    
    return {"error": f"Treatment ID {treatment_id} not found for case '{case_id}'"}
