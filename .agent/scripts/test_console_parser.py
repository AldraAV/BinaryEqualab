import sys
import os

# Ajustar path para importar desde backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
from routers.console_router import evaluar_comando, PeticionConsola

def ejecutar_test(nombre: str, expresion: str, aproximacion_esperada: str = None, debe_fallar: bool = False):
    print(f"▶ TEST: {nombre}")
    print(f"  Expresión: {expresion}")
    try:
        peticion = PeticionConsola(expression=expresion)
        resultado = evaluar_comando(peticion)
        print(f"  Resultado Exacto: {resultado.get('resultado')}")
        print(f"  Aproximación: {resultado.get('aproximacion')}")
        print(f"  Motor Usado: {resultado.get('motor')}")
        
        aprox_obtenida = resultado.get('aproximacion', '')
        if aproximacion_esperada and not aprox_obtenida.startswith(aproximacion_esperada):
            print(f"  ❌ FALLÓ: Se esperaba {aproximacion_esperada}, se obtuvo {aprox_obtenida}")
            return False
        
        if debe_fallar:
            print(f"  ❌ FALLÓ: Se esperaba un error pero la ejecución fue exitosa.")
            return False
            
        print("  ✅ ÉXITO\n")
        return True
    except Exception as e:
        if debe_fallar:
            print(f"  ✅ ÉXITO (Falló como se esperaba: {str(e)})\n")
            return True
        else:
            print(f"  ❌ FALLÓ por Excepción: {str(e)}\n")
            return False

def main():
    print("========================================")
    print("🤖 INICIANDO PRUEBAS DE LA CONSOLA CAS")
    print("========================================\n")
    
    exitos = 0
    total = 0
    
    pruebas = [
        ("Evaluación Simple (SymEngine)", "2 + 2", "4", False),
        ("Seno Hiperbólico + Logaritmo (SymPy)", "sinh(2)+log(10)", "5.929", False),
        ("Distribución Normal CDF (SymPy)", "normalcdf(0,0,1)", "0.5", False),
        ("Distribución Binomial (SymPy)", "binomialpmf(5,10,0.5)", "0.246", False),
        ("Sumatoria Básica (SymPy)", "sumatoria(x, x, 1, 10)", "55", False),
        ("Comando Vacío", "", None, True),
        ("Sintaxis Inválida (Desbalance de Paréntesis)", "sin(3))", None, True)
    ]
    
    for nombre, expr, aprox, debe_fallar in pruebas:
        total += 1
        if ejecutar_test(nombre, expr, aprox, debe_fallar):
            exitos += 1
            
    print("========================================")
    print(f"📊 RESULTADO FINAL: {exitos}/{total} pruebas exitosas.")
    print("========================================")
    
    if exitos != total:
        sys.exit(1)

if __name__ == "__main__":
    main()
