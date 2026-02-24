"""
Binary EquaLab - SymbolicExplainer
Generador de pasos matemáticos en KaTeX para modelos bio-médicos.
"""

class SymbolicExplainer:
    def __init__(self):
        pass

    def explain_pti(self, params, initial_y, result_data):
        """
        Genera el desglose paso a paso de la dinámica de plaquetas (PTI).
        """
        prod = params.get('production_rate', 50000)
        dest = params.get('destruction_rate', 0.1)
        ab_prod = params.get('antibody_production', 0.05)
        
        steps = [
            {
                "title": "Ecuaciones Fundamentales del Modelo",
                "latex": r"\begin{aligned} \frac{dP}{dt} &= P_{prod} - P_{dest} \cdot A - Sangrado \\ \frac{dA}{dt} &= A_{prod} - \frac{\ln(2)}{t_{1/2}} \cdot A \end{aligned}",
                "description": "El sistema modela la interacción entre el recuento de plaquetas (P) y la carga de auto-anticuerpos (A)."
            },
            {
                "title": "Configuración de Parámetros",
                "latex": f"\\begin{aligned} P_{{prod}} &= {prod:,} \\text{{ plaq/uL/día}} \\\\ A_{{prod}} &= {ab_prod} \\text{{ unidades/día}} \\end{aligned}",
                "description": "Valores iniciales basados en el perfil del paciente."
            }
        ]
        
        # Agregar lógica condicional según tratamiento
        treatment_id = params.get('treatment', 0)
        if treatment_id == 1:
            steps.append({
                "title": "Efecto de la Prednisona (Corticoide)",
                "latex": r"P_{dest} \leftarrow P_{dest} \cdot (1 - \text{eficacia} \cdot 0.5)",
                "description": "La prednisona reduce la destrucción periférica y la producción de anticuerpos al suprimir la respuesta inmune."
            })
        elif treatment_id == 2:
            steps.append({
                "title": "Efecto de la Inmunoglobulina (IVIG)",
                "latex": r"P_{dest} \leftarrow P_{dest} \cdot (1 - \text{eficacia} \cdot 0.8)",
                "description": "La IVIG bloquea los receptores Fc en los macrófagos, impidiendo que destruyan las plaquetas marcadas."
            })

        return steps

    def get_ode_latex(self, model_name):
        if model_name == "pti":
            return r"\frac{dP}{dt} = \Pi - \delta \cdot A(t) \cdot P(t)"
        return ""
