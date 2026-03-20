"""
Séptima - SymbolicExplainer Service
Motor educativo que explica paso a paso las ecuaciones de modelos biomédicos.

Genera explicaciones en español con LaTeX, pasos intermedios, y razonamiento
médico detrás de cada ecuación diferencial.
"""

from typing import List, Dict, Any, Optional


class SymbolicExplainer:
    """
    Engine that explains biomedical ODE models step by step.
    
    Generates structured mathematical explanations with:
    - LaTeX-rendered equations (KaTeX compatible)
    - Natural language descriptions (Spanish)
    - Medical context for each equation term
    - Treatment effect analysis
    """

    def explain_pti(self, params: Optional[Dict] = None, initial_y=None, result_data=None) -> List[Dict]:
        """
        Explain the PTI (ITP) model equations step by step.
        Returns a list of step dicts with title, latex, description, and medical_context.
        """
        p = params or {}
        base_prod = p.get("production_rate", 30000)
        k_dest = p.get("destruction_rate", 60000)
        Km = p.get("Km", 50000)
        ab_prod_rate = p.get("antibody_production", 0.15)
        ab_half = p.get("antibody_half_life", 21)
        treatment_id = int(p.get("treatment", 0))
        dose_mg = p.get("dose_mg", 60)
        
        steps = []
        
        # ─── Step 1: ODE system ───
        steps.append({
            "title": "Sistema de Ecuaciones Diferenciales (EDO)",
            "latex": (
                r"\begin{cases}"
                r"\dfrac{dP}{dt} = \Pi(P) - \dfrac{P}{\tau} - \dfrac{k_d \cdot A \cdot P}{K_m + P} - B(P) \\"
                r"\dfrac{dA}{dt} = \alpha - \dfrac{\ln 2}{t_{1/2}} \cdot A"
                r"\end{cases}"
            ),
            "description": (
                "Dos variables de estado: P (plaquetas /μL) y A (autoanticuerpos). "
                "La ecuación modela producción, muerte natural, destrucción inmune, y sangrado."
            ),
            "medical_context": (
                "En PTI, el sistema inmune produce anticuerpos que destruyen plaquetas prematuramente. "
                "El sistema busca el equilibrio entre producción medular y destrucción autoinmune."
            )
        })
        
        # ─── Step 2: Production (TPO feedback) ───
        steps.append({
            "title": "Producción Medular — Regulación TPO (Trombopoietina)",
            "latex": (
                r"\Pi(P) = " + str(base_prod) +
                r" \times \left(1 + 1.5 \times \dfrac{400000^2}{400000^2 + P^2}\right)"
            ),
            "description": (
                f"Producción base: {base_prod:,}/μL/día. Regulada por retroalimentación negativa tipo Hill. "
                "Cuando P baja → TPO sube → producción aumenta (hasta ×2.5). "
                "Cuando P > 400k → producción se reduce."
            ),
            "medical_context": (
                "La trombopoietina (TPO) es producida por hepatocitos. "
                "Se une a receptores c-Mpl en plaquetas circulantes — cuando hay pocas plaquetas, "
                "más TPO queda libre para estimular megacariocitos en médula ósea."
            )
        })
        
        # ─── Step 3: Senescence ───
        steps.append({
            "title": "Senescencia Natural — Vida media plaquetaria",
            "latex": r"\text{Senescencia} = \dfrac{P}{\tau} \quad \text{donde } \tau = 10 \text{ días}",
            "description": (
                "Las plaquetas viven ~8-10 días. Son eliminadas por el sistema reticuloendotelial "
                "(hígado, bazo) al envejecer. Este es el consumo normal en una persona sana."
            ),
            "medical_context": (
                "En un adulto sano, ~25,000 PLT/μL/día son removidas por senescencia. "
                "La producción compensatoria mantiene el balance en 150-400k."
            )
        })
        
        # ─── Step 4: Immune destruction (Michaelis-Menten) ───
        steps.append({
            "title": "Destrucción Autoinmune — Cinética Michaelis-Menten",
            "latex": (
                r"D(P,A) = \dfrac{k_d \cdot A \cdot P}{K_m + P} = "
                r"\dfrac{" + str(k_dest) + r" \cdot A \cdot P}{" + str(Km) + r" + P}"
            ),
            "description": (
                f"Destrucción máxima: {k_dest:,}/μL/día. Satura a K_m = {Km:,}/μL. "
                "Los receptores Fcγ del bazo tienen capacidad finita — "
                "a PLT altas, la destrucción no crece linealmente."
            ),
            "medical_context": (
                "Anticuerpos IgG anti-GPIIb/IIIa se unen a las plaquetas, marcándolas "
                "para fagocitosis por macrófagos esplénicos. La cinética de Michaelis-Menten "
                "modela la saturación de los receptores Fc del bazo (biológicamente correcto)."
            )
        })
        
        # ─── Step 5: Bleeding ───
        steps.append({
            "title": "Pérdida por Sangrado Espontáneo",
            "latex": (
                r"B(P) = \begin{cases}"
                r"3000 \left(\dfrac{20000 - P}{20000}\right)^2 & P < 20{,}000 \\"
                r"0 & P \geq 20{,}000"
                r"\end{cases}"
            ),
            "description": (
                "Sangrado espontáneo aparece cuando PLT < 20,000 (petequias, equimosis). "
                "Debajo de 10,000, riesgo significativo de hemorragia intracraneal."
            ),
            "medical_context": (
                "La función cuadrática modela la relación no-lineal entre trombocitopenia "
                "y sangrado clínico. Debajo de 5,000 PLT/μL, riesgo diario de hemorragia "
                "fatal es ~15%."
            )
        })
        
        # ─── Step 6: Antibody dynamics ───
        decay_rate = round(0.693 / ab_half, 4)
        A_eq = round(ab_prod_rate / decay_rate, 2) if decay_rate > 0 else 0
        steps.append({
            "title": "Dinámica de Autoanticuerpos IgG",
            "latex": (
                r"\dfrac{dA}{dt} = \alpha - \lambda \cdot A = "
                + str(ab_prod_rate) + r" - " + str(decay_rate) + r" \cdot A"
                + r"\quad \Rightarrow \quad A_{eq} = \dfrac{\alpha}{\lambda} = " + str(A_eq)
            ),
            "description": (
                f"Anticuerpos producidos a {ab_prod_rate}/día, decaen con vida media de {ab_half} días. "
                f"Equilibrio: A_eq = {A_eq}."
            ),
            "medical_context": (
                "Los linfocitos B autorreactivos producen anti-GPIIb/IIIa continuamente. "
                "Sin tratamiento, los anticuerpos estabilizan y mantienen la destrucción crónica."
            )
        })
        
        # ─── Step 7: Treatment effect ───
        if treatment_id == 1:
            steps.append({
                "title": "Efecto de la Prednisona (Corticosteroide)",
                "latex": (
                    r"D_{tratado} = D(P,A) \times \underbrace{(1 - 0.8 \times 0.7 \times f_d)}_{\text{factor inmunosupresor}}"
                    r"\\ f_d = \min\left(\dfrac{" + str(int(dose_mg)) + r"}{60}, 2\right)"
                ),
                "description": (
                    f"Dosis: {dose_mg}mg/día. Reduce destrucción inmune y producción de anticuerpos. "
                    "⚠️ >60mg por >14 días → Síndrome de Cushing."
                ),
                "medical_context": (
                    "Primera línea en PTI. Respuesta en 70-80%, pero solo 10-30% remisión sostenida. "
                    "Efectos adversos limitan uso prolongado: Cushing, hiperglucemia, osteoporosis, "
                    "inmunosupresión. Efecto rebound al suspender abruptamente."
                )
            })
        elif treatment_id == 2:
            steps.append({
                "title": "Efecto de la IVIG (Inmunoglobulina IV)",
                "latex": (
                    r"D_{tratado} = D(P,A) \times (1 - 0.8 \times 0.8 \times f_d)"
                ),
                "description": (
                    "Bloquea receptores Fc del bazo → reduce destrucción sin afectar anticuerpos. "
                    "Respuesta rápida (24-48h). Efecto temporal 2-4 semanas."
                ),
                "medical_context": (
                    "Ideal para emergencias hemorrágicas. No modifica la producción de autoanticuerpos. "
                    "Las plaquetas suben rápido pero vuelven a caer al pasar el efecto."
                )
            })
        elif treatment_id == 3:
            steps.append({
                "title": "Efecto de la Esplenectomía",
                "latex": (
                    r"D_{post} = D(P,A) \times (1 - 0.85 \times S_{éxito})"
                ),
                "description": (
                    "Elimina el principal sitio de destrucción plaquetaria (bazo). "
                    "60-80% remisión completa. 20% recaída en niños."
                ),
                "medical_context": (
                    "Segunda línea cuando corticoides fallan. En niños se posterga (20% remisión "
                    "espontánea). Requiere vacunación pre-op contra encapsulados. "
                    "Inmunodeficiencia permanente contra S. pneumoniae, H. influenzae, N. meningitidis."
                )
            })
        else:
            steps.append({
                "title": "Sin Tratamiento — Observación",
                "latex": r"D_{sin\_tto} = D(P,A) \times 1.0 \quad \text{(sin modificación)}",
                "description": (
                    "Sin tratamiento, la destrucción inmune procede sin freno. "
                    "Las plaquetas caen a un equilibrio bajo (~20-30k) con riesgo hemorrágico constante."
                ),
                "medical_context": (
                    "En PTI crónica no tratada, el paciente vive con trombocitopenia severa. "
                    "Cada día existe probabilidad de hemorragia fatal espontánea."
                )
            })
        
        return steps

    def get_ode_latex(self, model_name: str) -> str:
        """Returns the LaTeX representation of the ODE system for a given model."""
        models = {
            "pti": (
                r"\begin{cases}"
                r"\dfrac{dP}{dt} = \Pi(P) - \dfrac{P}{\tau} - \dfrac{k_d \cdot A \cdot P}{K_m + P} - B(P) \\"
                r"\dfrac{dA}{dt} = \alpha - \dfrac{\ln 2}{t_{1/2}} \cdot A"
                r"\end{cases}"
            ),
            "bergman": (
                r"\begin{cases}"
                r"\dfrac{dG}{dt} = -(p_1 + X) \cdot G + p_1 \cdot G_b + \dfrac{D(t)}{V_G} \\"
                r"\dfrac{dX}{dt} = -p_2 \cdot X + p_3 \cdot (I - I_b) \\"
                r"\dfrac{dI}{dt} = -n \cdot I + \gamma \cdot (G - h)^+ \cdot t"
                r"\end{cases}"
            ),
            "hodgkin_huxley": (
                r"C_m \dfrac{dV}{dt} = I_{ext} - g_{Na} m^3 h (V - E_{Na}) "
                r"- g_K n^4 (V - E_K) - g_L (V - E_L)"
            ),
            "pk_1cmt": (
                r"\dfrac{dC}{dt} = \dfrac{D \cdot k_a}{V_d} e^{-k_a t} - k_e \cdot C"
            ),
            "windkessel": (
                r"P(t) = P_d + (P_s - P_d) \cdot e^{-t/(R \cdot C)}"
            ),
        }
        return models.get(model_name, "")
    
    def explain_treatment_effect(self, treatment: str) -> Dict[str, Any]:
        """Returns detailed explanation of a PTI treatment's pharmacological effect."""
        treatments = {
            "prednisone": {
                "name": "Prednisona (Corticosteroide)",
                "mechanism": "Inmunosupresión: reduce destrucción inmune + producción de anticuerpos",
                "response_rate": "70-80%",
                "sustained_remission": "10-30%",
                "onset": "3-7 días",
                "side_effects": [
                    "Cushing (>60mg >14 días)",
                    "Hiperglucemia",
                    "Osteoporosis",
                    "Inmunosupresión severa (>100mg >7 días)",
                    "Rebound al suspender"
                ]
            },
            "ivig": {
                "name": "Inmunoglobulina IV (IVIG)",
                "mechanism": "Bloqueo de receptores Fc esplénicos",
                "response_rate": "80-90%",
                "sustained_remission": "Temporal (2-4 semanas)",
                "onset": "24-48 horas",
                "side_effects": [
                    "Cefalea severa (20-50%)",
                    "Meningitis aséptica (rara)",
                    "Reacciones alérgicas"
                ]
            },
            "splenectomy": {
                "name": "Esplenectomía",
                "mechanism": "Eliminación del sitio principal de destrucción",
                "response_rate": "60-80%",
                "sustained_remission": "60-80% (20% recaída en niños)",
                "onset": "Inmediato post-quirúrgico",
                "side_effects": [
                    "Inmunodeficiencia permanente",
                    "Requiere vacunación pre-op",
                    "Riesgo quirúrgico",
                    "Trombocitosis reactiva"
                ]
            }
        }
        return treatments.get(treatment.lower(), {"error": f"Tratamiento '{treatment}' no reconocido"})
