"""
clinical_cases_all.py — Casos Clínicos Interactivos Multi-Módulo
Cada módulo tiene 2 escenarios con objetivo terapéutico medible.
"""

CLINICAL_CASES = {

    # ─── GLUCOSA (Modelo Bergman) ───────────────────────────────────────────────
    "glucose": [
        {
            "id": "dm2_crisis",
            "title": "Crisis Hiperglucémica en DM2",
            "difficulty": "intermediate",
            "patient": {
                "name": "María García",
                "age": 58,
                "history": "Diabetes Tipo 2 diagnosticada hace 12 años. HbA1c: 9.2%. En tratamiento con metformina 850mg c/12h. Acude a urgencias con glucemia de 380 mg/dL, poliuria y polidipsia.",
            },
            "objective": "Reducir la glucemia por debajo de 180 mg/dL en 6 horas usando parámetros de insulina.",
            "hints": [
                "La sensibilidad a insulina (p3) está muy reducida en DM2 avanzada.",
                "Aumentar demasiado la insulina puede causar hipoglucemia (<70 mg/dL).",
                "El parámetro p1 refleja la captación de glucosa independiente de insulina.",
            ],
            "initial_params": {
                "g0": 380, "i0": 8, "x0": 0,
                "p1": 0.01, "p2": 0.02, "p3": 0.000008,
                "Gb": 100, "Ib": 8, "n": 0.12,
            },
            "success_criteria": {
                "variable_index": 0,
                "target_max": 180,
                "at_time_pct": 0.8,
                "fail_below": 60,
            },
            "success_msg": "¡Glucemia controlada! El paciente sale de la crisis hiperglucémica.",
            "fail_msg": "La glucemia sigue por encima de 180 mg/dL. Intenta aumentar la sensibilidad insulínica (p3).",
            "danger_msg": "¡HIPOGLUCEMIA! Glucosa < 60 mg/dL. Reduce la dosis de insulina.",
        },
        {
            "id": "neonatal_hypo",
            "title": "Hipoglucemia Neonatal",
            "difficulty": "advanced",
            "patient": {
                "name": "Bebé Rodríguez",
                "age": 0,
                "history": "Recién nacido de 2.8kg, hijo de madre diabética. Glucemia al nacer: 35 mg/dL. Tembloroso, irritable. Requiere intervención rápida para evitar daño neurológico.",
            },
            "objective": "Mantener glucosa por encima de 60 mg/dL durante toda la simulación sin exceder 150 mg/dL.",
            "hints": [
                "Glucosa IV (dextrosa 10%) eleva Gb directamente.",
                "Los neonatos tienen alta captación de glucosa (p1 elevada).",
                "Evitar hiperglucemia de rebote que causa daño osmótico.",
            ],
            "initial_params": {
                "g0": 35, "i0": 25, "x0": 0,
                "p1": 0.06, "p2": 0.03, "p3": 0.00003,
                "Gb": 40, "Ib": 15, "n": 0.18,
            },
            "success_criteria": {
                "variable_index": 0,
                "target_min": 60,
                "target_max": 150,
                "at_time_pct": 1.0,
                "fail_below": 40,
            },
            "success_msg": "¡Glucemia estabilizada! El neonato se recupera sin secuelas neurológicas.",
            "fail_msg": "La glucosa no alcanzó el rango objetivo. Ajusta Gb (aporte exógeno de glucosa).",
            "danger_msg": "¡HIPOGLUCEMIA PERSISTENTE! Glucosa < 40 mg/dL → riesgo de convulsiones neonatales.",
        },
    ],

    # ─── NEURONAL (Hodgkin-Huxley) ──────────────────────────────────────────────
    "neural": [
        {
            "id": "anesthesia_titration",
            "title": "Titulación de Anestesia Local",
            "difficulty": "intermediate",
            "patient": {
                "name": "Carlos Mendoza",
                "age": 42,
                "history": "Cirugía de túnel carpiano programada. Se requiere anestesia regional con bloqueo de nervio mediano usando lidocaína. Objetivo: eliminar la conducción nerviosa sin depresión cardíaca.",
            },
            "objective": "Reducir la conductancia de Na⁺ (g_Na) hasta eliminar los potenciales de acción, SIN reducirla por debajo de 20 mS/cm² (toxicidad cardíaca).",
            "hints": [
                "La lidocaína bloquea canales Nav1.7 → reduce g_Na.",
                "Con g_Na < 40, los potenciales de acción empiezan a fallar.",
                "Con g_Na < 20, hay riesgo de arritmia cardíaca.",
            ],
            "initial_params": {
                "I_ext": 10, "g_Na": 120, "g_K": 36,
            },
            "success_criteria": {
                "variable_index": 0,
                "max_peak": 0,
                "g_Na_min": 20,
            },
            "success_msg": "¡Bloqueo nervioso exitoso! El paciente no siente dolor y la función cardíaca es normal.",
            "fail_msg": "Aún hay potenciales de acción. Reduce más g_Na (la lidocaína necesita más tiempo).",
            "danger_msg": "¡g_Na < 20! Riesgo de bloqueo cardíaco. Administrar intralipid de rescate.",
        },
        {
            "id": "epilepsy_control",
            "title": "Control de Crisis Epiléptica",
            "difficulty": "advanced",
            "patient": {
                "name": "Ana Lucía Vega",
                "age": 19,
                "history": "Epilepsia focal con generalización secundaria. Convulsionando hace 8 minutos (status epilepticus). Requiere control urgente con anticonvulsivantes IV.",
            },
            "objective": "Reducir la frecuencia de potenciales de acción a máximo 3 PAs en 100ms, sin silenciar completamente la neurona.",
            "hints": [
                "Los anticonvulsivantes (fenitoína) reducen g_Na moderadamente.",
                "Las benzodiacepinas potencian GABA → equivalente a reducir I_ext.",
                "Silenciar la neurona completamente (0 PAs) causa depresión respiratoria.",
            ],
            "initial_params": {
                "I_ext": 25, "g_Na": 160, "g_K": 28,
            },
            "success_criteria": {
                "variable_index": 0,
                "max_aps": 3,
                "min_aps": 1,
            },
            "success_msg": "¡Crisis controlada! Actividad neuronal normalizada sin depresión respiratoria.",
            "fail_msg": "Demasiados potenciales de acción. Intenta reducir I_ext (benzodiazepinas) o g_Na (fenitoína).",
            "danger_msg": "¡0 potenciales de acción! Depresión respiratoria — necesita intubación.",
        },
    ],

    # ─── CARDIOVASCULAR (Windkessel + ECG) ──────────────────────────────────────
    "cardiovascular": [
        {
            "id": "hypertension_emergency",
            "title": "Emergencia Hipertensiva",
            "difficulty": "intermediate",
            "patient": {
                "name": "Roberto Jiménez",
                "age": 67,
                "history": "Hipertensión arterial no controlada. Llega a urgencias con PA 210/130 mmHg, cefalea intensa, visión borrosa. Riesgo de ACV hemorrágico inminente.",
            },
            "objective": "Reducir la presión sistólica por debajo de 160 mmHg ajustando resistencia vascular, SIN bajar de 90 mmHg (shock).",
            "hints": [
                "Nitroprusiato IV reduce resistencia periférica (R).",
                "Reducir R demasiado rápido causa hipotensión y síncope.",
                "La compliance (C) refleja la elasticidad aórtica — en hipertensos crónicos es baja.",
            ],
            "initial_params": {
                "bpm": 95, "resistance": 2.2, "compliance": 0.6,
            },
            "success_criteria": {
                "systolic_max": 160,
                "systolic_min": 90,
            },
            "success_msg": "¡Presión controlada! El paciente sale de la emergencia hipertensiva sin ACV.",
            "fail_msg": "Presión aún > 160 mmHg. Reduce más la resistencia vascular (R).",
            "danger_msg": "¡Hipotensión severa! PA < 90 mmHg → riesgo de shock. Sube R.",
        },
        {
            "id": "bradycardia_treatment",
            "title": "Bradicardia Sintomática",
            "difficulty": "beginner",
            "patient": {
                "name": "Elena Torres",
                "age": 74,
                "history": "Bradicardia sinusal de 38 BPM. Mareo, presíncope, fatiga extrema. Requiere atropina IV o marcapasos temporal.",
            },
            "objective": "Llevar la frecuencia cardíaca entre 60-100 BPM SIN causar taquicardia (>110 BPM).",
            "hints": [
                "Atropina eleva BPM al bloquear el tono vagal.",
                "Sobredosis de atropina causa taquicardia y arritmias.",
                "La compliance puede compensar parte del gasto cardíaco.",
            ],
            "initial_params": {
                "bpm": 38, "resistance": 1.3, "compliance": 1.2,
            },
            "success_criteria": {
                "bpm_min": 60,
                "bpm_max": 100,
            },
            "success_msg": "¡Frecuencia cardíaca normalizada! El paciente ya no tiene síntomas.",
            "fail_msg": "BPM aún bajo. Aumenta la frecuencia cardíaca (atropina).",
            "danger_msg": "¡Taquicardia! BPM > 110 → riesgo de isquemia miocárdica. Reduce BPM.",
        },
    ],

    # ─── FARMACOCINÉTICA (1-Compartimento) ──────────────────────────────────────
    "pharma": [
        {
            "id": "gentamicin_renal",
            "title": "Dosificación en Insuficiencia Renal",
            "difficulty": "advanced",
            "patient": {
                "name": "Fernando Ruiz",
                "age": 71,
                "history": "Bacteriemia por E. coli. Creatinina: 3.2 mg/dL (insuficiencia renal moderada). Requiere gentamicina IV. La eliminación renal está reducida al 30% de lo normal.",
            },
            "objective": "Mantener la concentración pico > 0.005 mg/mL (eficacia) y valle < 0.002 mg/mL (evitar nefrotoxicidad).",
            "hints": [
                "La eliminación (ke) está reducida proporcionalmente a la función renal.",
                "Espaciar más las dosis (aumentar intervalo) reduce los valles.",
                "Reducir la dosis baja el pico pero también el valle.",
            ],
            "initial_params": {
                "dose": 80, "ka": 0.8, "ke": 0.10, "Vd": 18,
                "F": 1.0, "t_end": 72, "interval": 8, "n": 9,
                "threshold": 0.005, "toxic": 0.012,
            },
            "success_criteria": {
                "peak_above": 0.005,
                "trough_below": 0.002,
            },
            "success_msg": "¡Dosificación exitosa! Niveles terapéuticos sin nefrotoxicidad.",
            "fail_msg": "Los niveles no están en rango terapéutico. Ajusta dosis e intervalo.",
            "danger_msg": "¡Valle > 0.002! Riesgo de nefrotoxicidad y ototoxicidad acumulativa.",
        },
        {
            "id": "digoxin_toxicity",
            "title": "Intoxicación Digitálica",
            "difficulty": "intermediate",
            "patient": {
                "name": "Doña Carmen",
                "age": 82,
                "history": "ICC con digoxina 0.25mg/día × 10 días. Llega con náuseas, bradicardia (45 BPM), visión amarilla. Nivel sérico: 3.2 ng/mL (tóxico > 2.0).",
            },
            "objective": "Reducir las concentraciones a rango terapéutico (0.5-2.0 ng/mL) ajustando dosis y frecuencia.",
            "hints": [
                "La digoxina tiene vida media de ~36h en ancianos.",
                "Suspender 1-2 dosis puede ser suficiente para bajar niveles.",
                "Reducir la dosis a 0.125mg o espaciar a cada 48h.",
            ],
            "initial_params": {
                "dose": 0.25, "ka": 0.5, "ke": 0.021, "Vd": 440,
                "F": 0.70, "t_end": 168, "interval": 24, "n": 7,
                "threshold": 0.0005, "toxic": 0.002,
            },
            "success_criteria": {
                "peak_below": 0.002,
                "trough_above": 0.0005,
            },
            "success_msg": "¡Niveles normalizados! Digoxina en rango terapéutico, síntomas resueltos.",
            "fail_msg": "Aún en rango tóxico. Reduce la dosis o aumenta el intervalo entre dosis.",
            "danger_msg": "¡Subterapéutico! Riesgo de descompensación cardíaca.",
        },
    ],
}


def get_modules_with_cases():
    """List all modules that have clinical cases."""
    return {
        module: {
            "total": len(cases),
            "cases": [
                {"id": c["id"], "title": c["title"], "difficulty": c["difficulty"],
                 "patient_name": c["patient"]["name"], "patient_age": c["patient"]["age"]}
                for c in cases
            ]
        }
        for module, cases in CLINICAL_CASES.items()
    }


def get_cases_for_module(module: str):
    """Get all cases for a specific module."""
    cases = CLINICAL_CASES.get(module, [])
    return {
        "module": module,
        "total": len(cases),
        "cases": [
            {"id": c["id"], "title": c["title"], "difficulty": c["difficulty"],
             "patient_name": c["patient"]["name"], "patient_age": c["patient"]["age"]}
            for c in cases
        ]
    }


def get_case_detail(module: str, case_id: str):
    """Get full detail of a specific case."""
    cases = CLINICAL_CASES.get(module, [])
    for c in cases:
        if c["id"] == case_id:
            return c
    return None


def evaluate_case(module: str, case_id: str, simulation_result: dict):
    """Evaluate whether the student achieved the clinical objective."""
    case = get_case_detail(module, case_id)
    if not case:
        return {"error": "Case not found"}

    criteria = case["success_criteria"]
    y_data = simulation_result.get("y", [])
    params = simulation_result.get("params", {})

    if module == "glucose":
        if not y_data:
            return {"success": False, "feedback": case["fail_msg"]}
        # Check glucose at specified time
        check_idx = int(len(y_data) * criteria.get("at_time_pct", 0.8))
        glucose_at_check = y_data[check_idx][0] if isinstance(y_data[check_idx], list) else y_data[check_idx]

        fail_below = criteria.get("fail_below", 0)
        if any((row[0] if isinstance(row, list) else row) < fail_below for row in y_data):
            return {"success": False, "feedback": case["danger_msg"], "is_danger": True}

        target_max = criteria.get("target_max", 999999)
        target_min = criteria.get("target_min", 0)
        if target_min <= glucose_at_check <= target_max:
            return {"success": True, "feedback": case["success_msg"]}
        return {"success": False, "feedback": case["fail_msg"]}

    elif module == "neural":
        # Count action potentials
        if not y_data:
            return {"success": False, "feedback": case["fail_msg"]}
        v_data = y_data[0] if isinstance(y_data[0], list) else y_data
        aps = 0
        prev_above = False
        for v in (v_data if isinstance(v_data[0], (int, float)) else [r[0] for r in v_data]):
            above = v > 0
            if above and not prev_above:
                aps += 1
            prev_above = above

        g_na = params.get("g_Na", 120)
        g_na_min = criteria.get("g_Na_min", 0)
        if g_na < g_na_min:
            return {"success": False, "feedback": case["danger_msg"], "is_danger": True}
        max_aps = criteria.get("max_aps", criteria.get("max_peak", 999))
        min_aps = criteria.get("min_aps", 0)
        if min_aps <= aps <= max_aps:
            return {"success": True, "feedback": case["success_msg"]}
        if aps == 0 and criteria.get("min_aps", 0) > 0:
            return {"success": False, "feedback": case["danger_msg"], "is_danger": True}
        return {"success": False, "feedback": case["fail_msg"]}

    elif module == "cardiovascular":
        bpm = params.get("bpm", 72)
        bpm_min = criteria.get("bpm_min", 0)
        bpm_max = criteria.get("bpm_max", 999)
        if bpm_min <= bpm <= bpm_max:
            return {"success": True, "feedback": case["success_msg"]}
        if bpm > bpm_max:
            return {"success": False, "feedback": case["danger_msg"], "is_danger": True}
        return {"success": False, "feedback": case["fail_msg"]}

    elif module == "pharma":
        # Check peak and trough from simulation data
        if not y_data:
            return {"success": False, "feedback": case["fail_msg"]}
        concentrations = [r[0] if isinstance(r, list) else r for r in y_data]
        peak = max(concentrations)
        trough = min(concentrations[len(concentrations)//2:])  # Trough in second half

        peak_above = criteria.get("peak_above", 0)
        peak_below = criteria.get("peak_below", 999)
        trough_below = criteria.get("trough_below", 999)
        trough_above = criteria.get("trough_above", 0)

        if peak > peak_below or trough > trough_below:
            return {"success": False, "feedback": case["danger_msg"], "is_danger": True}
        if peak >= peak_above and trough >= trough_above and peak <= peak_below and trough <= trough_below:
            return {"success": True, "feedback": case["success_msg"]}
        return {"success": False, "feedback": case["fail_msg"]}

    return {"success": False, "feedback": "Module evaluation not implemented."}
