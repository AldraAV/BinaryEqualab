import subprocess
import re
import os
import platform

class MaximaService:
    # Ruta tentativa, se puede configurar vía variables de entorno
    MAXIMA_PATH = os.getenv("MAXIMA_BIN_PATH", r"C:\maxima-5.47.0\bin\maxima.bat")
    
    @staticmethod
    def execute(command: str) -> str:
        """
        Ejecutar un comando en Maxima y retornar el resultado limpio.
        """
        if not os.path.exists(MaximaService.MAXIMA_PATH):
            return f"Error: Maxima no encontrado en {MaximaService.MAXIMA_PATH}. Por favor, instálalo o configura MAXIMA_BIN_PATH."

        # Envolver comando: evitar prompts y asegurar salida
        # --very-quiet: reduce ruido
        # -r: ejecuta comando y sale
        try:
            # Comando batch para Maxima
            # display2d:false devuelve salida en formato lineal (más fácil de parsear)
            full_cmd = f"display2d:false; {command};"
            
            process = subprocess.run(
                [MaximaService.MAXIMA_PATH, "--very-quiet", "-r", full_cmd],
                capture_output=True,
                text=True,
                timeout=15,
                encoding='utf-8',
                errors='ignore'
            )
            
            if process.returncode != 0:
                return f"Error de Maxima: {process.stderr}"
            
            return MaximaService._parse_output(process.stdout)
            
        except subprocess.TimeoutExpired:
            return "Error: Tiempo de espera de Maxima agotado."
        except Exception as e:
            return f"Error inesperado al ejecutar Maxima: {str(e)}"

    @staticmethod
    def solve_ode(eq: str, y: str = "y", x: str = "x"):
        """Resuelve EDOs de primer y segundo orden."""
        return MaximaService.execute(f"ode2({eq}, {y}, {x})")

    @staticmethod
    def laplace(func: str, t: str = "t", s: str = "s"):
        """Transformada de Laplace."""
        return MaximaService.execute(f"laplace({func}, {t}, {s})")

    @staticmethod
    def integrate(func: str, var: str = "x"):
        """Integral simbólica."""
        return MaximaService.execute(f"integrate({func}, {var})")

    @staticmethod
    def simplify(expr: str):
        """Simplificación algebraica avanzada."""
        return MaximaService.execute(f"ratsimp({expr})")

    @staticmethod
    def _parse_output(raw: str) -> str:
        """Limpia los prompts (%i1, %o1) y espacios de la salida de Maxima."""
        # Eliminar prompts de entrada y salida
        lines = raw.splitlines()
        result_lines = []
        for line in lines:
            # Ignorar líneas de cabecera o de comando
            if "(%i" in line: continue
            if "display2d:false" in line: continue
            # Capturar la línea de salida (%oX)
            if "(%o" in line:
                # Extraer contenido después del prompt
                match = re.search(r"\(%o\d+\)\s*(.*)", line)
                if match:
                    result_lines.append(match.group(1))
            else:
                # Otras líneas que podrían ser parte de la expresión
                if line.strip() and not line.startswith("Maxima"):
                    result_lines.append(line.strip())
        
        return " ".join(result_lines).strip()

# Singleton para uso en la app
maxima = MaximaService()
