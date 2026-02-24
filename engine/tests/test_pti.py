import sys
import os
import numpy as np

# Ruta al engine compilado
ENGINE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'python', 'equacore'))
sys.path.insert(0, ENGINE_PATH)

try:
    import _equacore
    print("[OK] Engine EquaCore cargado exitosamente.")
except ImportError as e:
    print(f"[ERROR] Error al cargar el engine: {e}")
    sys.exit(1)

def test_scenario(name, params, initial_y, days=30):
    print(f"\n- Escenario: {name}")
    try:
        res = _equacore.BioODESolver.simulate_pti(0, days, 0.1, initial_y, params)
        p_final = res.y[-1][0]
        interpretation = _equacore.BioODESolver.pti_clinical_interpretation(initial_y[0], p_final, days)
        print(f"   Plaquetas Finales: {p_final:,.0f}/uL")
        print(f"   Interpretacion: {interpretation}")
        return p_final
    except Exception as e:
        print(f"   [ERROR] Fallo en simulacion: {e}")
        return None

if __name__ == "__main__":
    print("=== Suite de Pruebas PTI - Septima Core ===")
    
    # Estado inicial: Plaquetas bajas (5,000), Anticuerpos altos (10)
    y0 = np.array([5000.0, 10.0])
    
    # 1. Historia Natural (Sin tratamiento)
    p_none = _equacore.PTIParams()
    p_none.initial_platelets = 5000.0
    p_none.production_rate = 50000.0
    p_none.destruction_rate = 0.0005
    p_none.antibody_half_life = 7.0
    p_none.antibody_production = 1.0
    p_none.treatment = 0
    p_none.treatment_efficacy = 0.0
    test_scenario("Historia Natural (Sin tratamiento)", p_none, y0)

    # 2. Respuesta a Prednisona
    p_pred = _equacore.PTIParams()
    p_pred.initial_platelets = 5000.0
    p_pred.production_rate = 50000.0
    p_pred.destruction_rate = 0.0005
    p_pred.antibody_half_life = 7.0
    p_pred.antibody_production = 1.0
    p_pred.treatment = 1 # Prednisona
    p_pred.treatment_efficacy = 0.8 # 80% eficacia
    test_scenario("Tratamiento: Prednisona (Eficacia 80%)", p_pred, y0)

    # 3. Respuesta a IVIG
    p_ivig = _equacore.PTIParams()
    p_ivig.initial_platelets = 5000.0
    p_ivig.production_rate = 50000.0
    p_ivig.destruction_rate = 0.0005
    p_ivig.antibody_half_life = 7.0
    p_ivig.antibody_production = 1.0
    p_ivig.treatment = 2 # IVIG
    p_ivig.treatment_efficacy = 0.9 # 90% eficacia
    test_scenario("Tratamiento: IVIG (Eficacia 90%)", p_ivig, y0)

    # 4. Esplenectomia
    p_splen = _equacore.PTIParams()
    p_splen.initial_platelets = 5000.0
    p_splen.production_rate = 50000.0
    p_splen.destruction_rate = 0.0005
    p_splen.antibody_half_life = 7.0
    p_splen.antibody_production = 1.0
    p_splen.treatment = 3 # Esplenectomia
    p_splen.treatment_efficacy = 1.0
    test_scenario("Tratamiento: Esplenectomia (Vida real)", p_splen, y0)

    print("\n[OK] Suite de pruebas finalizada.")
