"""
Binary EquaLab CLI
Interactive REPL and command-line interface.
"""

import sys
from typing import Optional
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.text import Text
from prompt_toolkit import PromptSession
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit.styles import Style
import os

from .engine import MathEngine

console = Console()

BANNER = """
[bold orange1]╔══════════════════════════════════════════════════════════╗
║    [white]Binary EquaLab CLI[/white]   [dim]v1.0.0[/dim]                          ║
║    [dim italic]"El álgebra también siente"[/dim italic]                           ║
╚══════════════════════════════════════════════════════════╝[/bold orange1]

[dim]Comandos:[/dim]
  [cyan]help[/cyan]     - Lista de funciones disponibles
  [cyan]exit[/cyan]     - Salir
  [cyan]cls[/cyan]      - Limpiar pantalla
  
[dim]Ejemplos:[/dim]
  derivar(x^2 + 3x, x)
  integrar(sin(x), x)
  van(0.10, -1000, 300, 400, 500)
"""

HELP_TEXT = """
## Funciones Disponibles

### Cálculo
| Función | Ejemplo |
|---------|---------|
| `derivar(expr, var)` | `derivar(x^2, x)` → `2*x` |
| `integrar(expr, var)` | `integrar(sin(x), x)` → `-cos(x)` |
| `limite(expr, var, punto)` | `limite(sin(x)/x, x, 0)` → `1` |
| `sumatoria(expr, var, a, b)` | `sumatoria(n^2, n, 1, 10)` |

### Álgebra
| Función | Ejemplo |
|---------|---------|
| `simplificar(expr)` | `simplificar((x^2-1)/(x-1))` |
| `expandir(expr)` | `expandir((x+1)^2)` |
| `factorizar(expr)` | `factorizar(x^2-1)` |
| `resolver(expr, var)` | `resolver(x^2-4, x)` → `[-2, 2]` |

### Estadística
| Función | Ejemplo |
|---------|---------|
| `media(...)` | `media(1, 2, 3, 4, 5)` → `3` |
| `mediana(...)` | `mediana(1, 2, 3, 4, 5)` → `3` |
| `desviacion(...)` | `desviacion(1, 2, 3, 4, 5)` |
| `varianza(...)` | `varianza(1, 2, 3, 4, 5)` |

### Finanzas
| Función | Ejemplo |
|---------|---------|
| `van(tasa, flujo0, flujo1, ...)` | `van(0.10, -1000, 300, 400)` |
| `tir(flujo0, flujo1, ...)` | `tir(-1000, 300, 400, 500)` |
| `depreciar(costo, residual, años)` | `depreciar(10000, 1000, 5)` |
| `interes_simple(capital, tasa, tiempo)` | `interes_simple(1000, 0.05, 3)` |
| `interes_compuesto(capital, tasa, n, tiempo)` | `interes_compuesto(1000, 0.05, 12, 3)` |
"""


def get_prompt_style():
    return Style.from_dict({
        'prompt': '#ff6b35 bold',
    })


def repl():
    """Start the interactive REPL."""
    console.print(BANNER)
    
    engine = MathEngine()
    
    # Setup history file
    history_path = os.path.expanduser("~/.binary_math_history")
    session: PromptSession = PromptSession(
        history=FileHistory(history_path),
        auto_suggest=AutoSuggestFromHistory(),
        style=get_prompt_style(),
    )
    
    while True:
        try:
            # Read input
            user_input = session.prompt([('class:prompt', '>>> ')]).strip()
            
            if not user_input:
                continue
            
            # Handle special commands
            if user_input.lower() in ('exit', 'quit', 'q'):
                console.print("[dim]¡Hasta luego![/dim]")
                break
            
            if user_input.lower() in ('cls', 'clear'):
                console.clear()
                console.print(BANNER)
                continue
            
            if user_input.lower() == 'help':
                console.print(Markdown(HELP_TEXT))
                continue
            
            if user_input.lower() == 'history':
                for i, h in enumerate(engine.history[-10:], 1):
                    console.print(f"[dim]{i}.[/dim] {h}")
                continue
            
            # Evaluate expression
            try:
                result = engine.evaluate(user_input)
                
                if result is None:
                    continue
                
                # Format output
                if isinstance(result, (list, tuple)):
                    console.print(f"[bold green]→[/bold green] {list(result)}")
                elif isinstance(result, dict):
                    for key, value in result.items():
                        console.print(f"  [cyan]{key}:[/cyan] {value}")
                else:
                    console.print(f"[bold green]→[/bold green] {result}")
                    
            except Exception as e:
                console.print(f"[bold red]Error:[/bold red] {e}")
                
        except KeyboardInterrupt:
            console.print()
            continue
        except EOFError:
            console.print("\n[dim]¡Hasta luego![/dim]")
            break


def one_liner(expression: str):
    """Evaluate a single expression from command line."""
    engine = MathEngine()
    try:
        result = engine.evaluate(expression)
        if isinstance(result, (list, tuple)):
            print(list(result))
        elif isinstance(result, dict):
            for key, value in result.items():
                print(f"{key}: {value}")
        else:
            print(result)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """CLI entry point."""
    elif len(sys.argv) > 1 and sys.argv[1] == 'setup-shell':
        from .shell_setup import run_setup
        run_setup()
    elif len(sys.argv) > 1:
        # One-liner mode
        expression = " ".join(sys.argv[1:])
        one_liner(expression)
    else:
        # REPL mode
        repl()


if __name__ == "__main__":
    main()
