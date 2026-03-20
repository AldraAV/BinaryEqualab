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
║    [white]Binary EquaLab CLI[/white]   [dim]Aurora v3.1[/dim]                    ║
║    [dim italic]"Las matemáticas también sienten,[/dim italic]                  ║
║    [dim italic] pero estas no se equivocan."[/dim italic]                  ║
╚══════════════════════════════════════════════════════════╝[/bold orange1]

[dim]Comandos:[/dim]
  [cyan]help[/cyan]     - Lista de funciones disponibles
  [cyan]exit[/cyan]     - Salir
  [cyan]cls[/cyan]      - Limpiar pantalla
   
[dim]Pro Tip:[/dim] Usa [bold]f(x) := x^2[/bold] para definir funciones, [bold];[/bold] para evaluar varias a la vez.

[dim]Ejemplos:[/dim]
  derivar(cos^2(2x))
  f(x) := x^2 + 1; f(3)
  esPrimo(97)
  taylor(sin(x), x, 0, 5)
"""

HELP_TEXT = """
## Funciones Disponibles (v3.1 — 64 funciones)

### Cálculo
| Función | Ejemplo |
|---------|---------|
| `derivar(expr, var)` | `derivar(x^2, x)` → `2*x` |
| `integrar(expr, var)` | `integrar(sin(x), x)` → `-cos(x)` |
| `limite(expr, var, punto)` | `limite(sin(x)/x, x, 0)` → `1` |
| `sumatoria(expr, var, a, b)` | `sumatoria(n^2, n, 1, 10)` |
| `taylor(expr, var, punto, orden)` | `taylor(sin(x), x, 0, 5)` |

### Trigonometría
| Función | Alias español |
|---------|---------|
| `sin`, `cos`, `tan` | `seno`, `coseno`, `tangente` |
| `csc`, `sec`, `cot` | cosecante, secante, cotangente |
| `asin`, `acos`, `atan` | `arcoseno`, `arcocoseno`, `arcotangente` |
| `acsc`, `asec`, `acot` | inversa extendida |
| `sinh`, `cosh`, `tanh` | `senh`, `cosh`, `tanh` |

### Álgebra
| Función | Ejemplo |
|---------|---------|
| `simplificar(expr)` | `simplificar((x^2-1)/(x-1))` |
| `expandir(expr)` | `expandir((x+1)^2)` |
| `factorizar(expr)` | `factorizar(x^2-1)` |
| `resolver(expr, var)` | `resolver(x^2-4, x)` → `[-2, 2]` |
| `parciales(expr, var)` | `parciales(1/(x^2-1), x)` |
| `mcd(a, b)` | `mcd(24, 36)` → `12` |
| `mcm(a, b)` | `mcm(4, 6)` → `12` |
| `esPrimo(n)` | `esPrimo(97)` → `Sí, 97 es primo` |
| `combinar(n, k)` | `combinar(10, 3)` → `120` |
| `permutar(n, k)` | `permutar(10, 3)` → `720` |
| `factoresPrimos(n)` | `factoresPrimos(360)` → `2^3 × 3^2 × 5` |

### Aritmética
| Función | Ejemplo |
|---------|---------|
| `mod(a, b)` | `mod(10, 3)` → `1` |
| `maximo(a, b)` | `maximo(3, 7)` → `7` |
| `minimo(a, b)` | `minimo(3, 7)` → `3` |
| `signo(x)` | `signo(-5)` → `-1` |
| `raizcub(x)` | `raizcub(27)` → `3` |

### Estadística
| Función | Ejemplo |
|---------|---------|
| `media(...)` | `media(1, 2, 3, 4, 5)` → `3` |
| `mediana(...)` | `mediana(1, 2, 3, 4, 5)` → `3` |
| `desviacion(...)` | `desviacion(1, 2, 3, 4, 5)` |
| `varianza(...)` | `varianza(1, 2, 3, 4, 5)` |
| `covarianza(xs..., ys...)` | `covarianza(1,2,3, 4,5,6)` |
| `correlacion(xs..., ys...)` | `correlacion(1,2,3, 2,4,6)` |
| `regresion(xs..., ys...)` | `regresion(1,2,3, 2,4,6)` |
| `normalpdf(x, mu, sigma)` | `normalpdf(0, 0, 1)` |
| `binomialpmf(k, n, p)` | `binomialpmf(3, 10, 0.5)` |

### Finanzas
| Función | Ejemplo |
|---------|---------|
| `van(tasa, flujo0, flujo1, ...)` | `van(0.10, -1000, 300, 400)` |
| `tir(flujo0, flujo1, ...)` | `tir(-1000, 300, 400, 500)` |
| `depreciar(costo, residual, años)` | `depreciar(10000, 1000, 5)` |
| `interes_simple(cap, tasa, t)` | `interes_simple(1000, 0.05, 3)` |
| `interes_compuesto(cap, tasa, n, t)` | `interes_compuesto(1000, 0.05, 12, 3)` |

### Audio & Geometría
| Función | Ejemplo |
|---------|---------|
| `sonify(expr)` | `sonify(sin(440*t))` |
| `distancia(p1, p2)` | `distancia((0,0), (3,4))` → `5` |
| `recta(p1, p2)` | `recta((0,0), (1,1))` → `y=x` |

### Sistemas Numéricos
| Función | Ejemplo |
|---------|---------|
| `bin(n)` | `bin(10)` → `0b1010` |
| `hex(n)` | `hex(255)` → `0xff` |
| `base(n, b)` | `base(10, 2)` → `1010` |

### Scripting
- `f(x) := x^2 + 1`  → Define función
- `f(3)`  → Evalúa: `10`
- Separador `;` para evaluar múltiples expresiones:
  `a = 5; b = 3; a + b` → `8`

"""


def get_prompt_style():
    return Style.from_dict({
        'prompt': '#ff6b35 bold',
    })


def print_banner():
    """Print the CLI banner using Rich panels."""
    title = Text("Binary EquaLab CLI", style="bold white")
    version = Text("Aurora v3.1", style="dim")
    slogan = Text('"Las matemáticas también sienten,\npero estas no se equivocan."', style="dim italic")

    content = Text.assemble(title, "  ", version, "\n\n", slogan, justify="center")
    panel = Panel(
        content, 
        border_style="bold orange1", 
        expand=False,
        subtitle="[dim]Escribe 'help' para ver comandos[/dim]"
    )
    console.print(panel)

def repl():
    """Start the interactive REPL."""
    print_banner()
    
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
            cmd = user_input.lower()
            if cmd in ('exit', 'quit', 'q'):
                console.print("[dim]¡Hasta luego![/dim]")
                break
            
            if cmd in ('cls', 'clear'):
                console.clear()
                print_banner()
                continue
            
            if cmd == 'help':
                console.print(Markdown(HELP_TEXT))
                continue
            
            if cmd == 'history':
                for i, h in enumerate(engine.history[-10:], 1):
                    console.print(f"[dim]{i}.[/dim] {h}")
                continue
            
            # --- Easter Eggs (Math Based) ---
            # 1+1 -> 2
            if user_input.replace(" ", "") == "1+1":
                console.print(Panel("[bold cyan]2[/bold cyan]\n[dim italic]El principio de todo.[/dim italic]", border_style="cyan"))
                continue
            
            # (-1)*(-1) -> 1
            if user_input.replace(" ", "") in ["(-1)*(-1)", "-1*-1"]:
                console.print(Panel("[bold green]1[/bold green]\n[dim italic]Menos por menos es más... como en la vida.[/dim italic]", border_style="green"))
                continue
                
            # The Answer
            if user_input.replace(" ", "") == "0b101010":
                console.print(Panel("[bold magenta]42[/bold magenta]\n[dim italic]La respuesta a todo.[/dim italic]", border_style="magenta"))
                continue
            # -------------------
            
            # Evaluate expression
            try:
                # Batch support: evaluate multiple expressions with ';'
                if ';' in user_input:
                    results = engine.evaluate_batch(user_input)
                    for r in results:
                        if r is not None:
                            if isinstance(r, (list, tuple)):
                                console.print(f"[bold green]→[/bold green] {list(r)}")
                            elif isinstance(r, dict):
                                for key, value in r.items():
                                    console.print(f"  [cyan]{key}:[/cyan] {value}")
                            else:
                                console.print(f"[bold green]→[/bold green] {r}")
                else:
                    result = engine.evaluate(user_input)
                    
                    if result is None:
                        continue
                    
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
    if len(sys.argv) > 1 and sys.argv[1] == 'setup-shell':
        from .shell_setup import run_setup
        run_setup()
    elif len(sys.argv) > 1 and sys.argv[1] == 'tui':
        from .tui import BinaryTUI
        app = BinaryTUI()
        app.run()
    elif len(sys.argv) > 1 and sys.argv[1] == 'ai':
        # AI Commands Mode (Kimi K2)
        from .services.kimi_service import kimi_service
        
        if len(sys.argv) < 3:
            console.print("[bold red]Uso:[/bold red] binary ai [solve|explain|exercises] \"consulta\"")
            sys.exit(1)
            
        subcmd = sys.argv[2]
        query = " ".join(sys.argv[3:])
        
        if subcmd != 'exercises' and not query:
             console.print("[bold red]Error:[/bold red] Falta la consulta.")
             sys.exit(1)
            
        with console.status(f"[bold green]Kimi AI ({subcmd})...[/bold green]"):
            if subcmd == "solve":
                result = kimi_service.solve_math_problem(query)
                if isinstance(result, dict):
                    console.print(Panel(
                        f"[bold]Solución:[/bold]\n{result.get('solution', '')}\n\n"
                        f"[bold]Dificultad:[/bold] {result.get('difficulty', '')}\n"
                        f"[bold]Conceptos:[/bold] {', '.join(result.get('concepts', []))}",
                        title="Kimi AI: Resolución", border_style="green"
                    ))
                    if result.get('steps'):
                        console.print("\n[bold]Pasos:[/bold]")
                        for step in result['steps']:
                            console.print(f"• {step}")
                    console.print(f"\n[dim italic]{result.get('reasoning', '')}[/dim italic]")
                else:
                    console.print(result)

            elif subcmd == "explain":
                response = kimi_service.explain_concept(query)
                console.print(Panel(Markdown(response), title=f"Kimi AI: Explicación", border_style="blue"))
            
            elif subcmd == "exercises":
                count = 3 # default
                # Simple parsing for count if present in args? For now keeping simple.
                exercises = kimi_service.generate_exercises(query if query else "Matemáticas Generales", count)
                
                console.print(f"[bold u]Generando ejercicios para:[/bold u] {query}\n")
                
                if not exercises:
                     console.print("No se pudieron generar ejercicios. Verifica tu API Key o intenta de nuevo.")

                for i, ex in enumerate(exercises, 1):
                    console.print(Panel(
                        f"[bold]Pregunta:[/bold]\n{ex.get('problem')}\n\n"
                        f"[bold]Solución:[/bold]\n{ex.get('solution')}",
                        title=f"Ejercicio {i}", border_style="magenta"
                    ))
                    if ex.get('steps'):
                         console.print(f"[dim]Pasos: {', '.join(ex.get('steps', []))}[/dim]\n")
            else:
                console.print(f"[bold red]Comando desconocido:[/bold red] {subcmd}")
                sys.exit(1)

    elif len(sys.argv) > 1 and sys.argv[1] == 'feedback':
        import webbrowser
        print("""
    ╔═══════════════════════════════════════╗
    ║        💬 Feedback & Soporte          ║
    ╚═══════════════════════════════════════╝
    
    ¡Gracias por usar Binary EquaLab! ❤️
    
    Estoy abierto a cualquier sugerencia, apoyo, financiamiento,
    compañía, o reporte de errores.
    
    🐛 Bugs / Mejoras: https://github.com/AldrasTeam/BinaryEquaLab/issues
    📧 Contacto: contact@aldra.dev
        """)
        webbrowser.open("https://github.com/AldrasTeam/BinaryEquaLab")

    elif len(sys.argv) > 1:
        # One-liner mode
        expression = " ".join(sys.argv[1:])
        one_liner(expression)
    else:
        # REPL mode
        repl()


if __name__ == "__main__":
    main()
