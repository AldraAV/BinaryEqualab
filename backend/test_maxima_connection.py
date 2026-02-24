import sys
import os

# Añadir el path del backend para importar el servicio
backend_path = r'c:\Users\carde\Desktop\MUACK\BinaryEquaLab\backend'
sys.path.append(backend_path)

try:
    from services.maxima_service import maxima
    print(f"Buscando Maxima en: {maxima.MAXIMA_PATH}")
    
    if not os.path.exists(maxima.MAXIMA_PATH):
        print("❌ ERROR: No se encontró el archivo maxima.bat")
        sys.exit(1)
        
    result = maxima.execute("1+1")
    print(f"✅ TEST EXITOSO: Maxima respondió: {result}")
    
    # Test de poder
    fourier_test = maxima.execute("laplace(sin(t), t, s)")
    print(f"🚀 TEST DE PODER (Laplace): {fourier_test}")
    
except Exception as e:
    print(f"❌ ERROR CRÍTICO: {str(e)}")
    sys.exit(1)
