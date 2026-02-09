from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Input, RichLog, Static
from textual.containers import Container
from textual import on, events
from textual.suggester import Suggester
from sympy import pretty
from .engine import MathEngine

class MathSuggester(Suggester):
    """Basic auto-complete for math commands."""
    def __init__(self):
        super().__init__(use_cache=False)
        self.suggestions = [
            "derivar(", "integrar(", "limite(", "sumatoria(", 
            "simplificar(", "expandir(", "factorizar(", "resolver(",
            "sonify(", "distancia(", "recta(", "circulo(",
            "sin(", "cos(", "tan(", "sqrt(", "log(",
            "matrix(", "help", "clear", "exit", "quit"
        ]
        
    async def get_suggestion(self, value: str) -> str | None:
        if not value: 
            return None
        # Simple prefix match
        word = value.split(" ")[-1] # last word
        if not word: return None
        
        for s in self.suggestions:
            if s.startswith(word) and s != word:
                # Return the ending part to complete the word
                return s[len(word):]
        return None

class BinaryTUI(App):
    """A Textual App for Binary EquaLab (Jupyter-Lite Style)."""
    
    CSS = """
    Screen {
        layout: vertical;
        background: #0f172a; /* Slate 900 */
    }
    
    RichLog {
        background: #1e293b; /* Slate 800 */
        color: #e2e8f0; /* Slate 200 */
        border: none;
        height: 1fr;
        padding: 1;
        scrollbar-background: #0f172a;
        scrollbar-color: #3b82f6;
    }
    
    Input {
        dock: bottom;
        margin: 0;
        border: wide #3b82f6; /* Blue 500 */
        background: #0f172a;
        color: #fb923c; /* Orange 400 */
        height: 3;
    }
    
    #welcome {
        color: #fb923c;
        text-style: bold;
        text-align: center;
        background: #0f172a;
        padding: 1;
        border-bottom: solid #3b82f6;
    }
    
    .in-prompt {
        color: #38bdf8; /* Sky 400 */
        text-style: bold;
    }
    
    .out-prompt {
        color: #fb923c; /* Orange 400 */
        text-style: bold;
    }
    
    #help-bar {
        background: #0f172a;
        color: #94a3b8; /* Slate 400 */
        padding-left: 1;
        height: 1;
        dock: bottom; /* Sit right above the input */
    }
    """

    BINDINGS = [
        ("ctrl+q", "quit", "Quit"),
        ("ctrl+c", "copy_or_ignore", "Copy/Ignore"), # Prevent accidental exit
        ("ctrl+l", "clear_screen", "Clear"),
    ]

    def action_copy_or_ignore(self) -> None:
        """Handle Ctrl+C safely."""
        self.notify("Usa Ctrl+Q o escribe 'exit' para salir.", title="No te vayas aún...", severity="warning")

    def __init__(self):
        super().__init__()
        self.engine = MathEngine()
        self.history = []
        self.history_index = -1
        self.execution_count = 1

    # Help Dictionary for Contextual Hints
    HELP_DOCS = {
        "derivar": "💡 derivar(expr, var) - Calcula la derivada. Ej: derivar(x^2, x)",
        "integrar": "💡 integrar(expr, var, [a, b]) - Integral indefinida o definida. Ej: integrar(sin(x), x)",
        "limite": "💡 limite(expr, var, punto) - Calcula el límite. Ej: limite(sin(x)/x, x, 0)",
        "sumatoria": "💡 sumatoria(expr, var, a, b) - Suma de a hasta b. Ej: sumatoria(n^2, n, 1, 10)",
        "simplificar": "💡 simplificar(expr) - Reduce la expresión. Ej: simplificar((x^2-1)/(x-1))",
        "expandir": "💡 expandir(expr) - Expande polinomios. Ej: expandir((x+1)^2)",
        "factorizar": "💡 factorizar(expr) - Factoriza polinomios. Ej: factorizar(x^2 - 1)",
        "resolver": "💡 resolver(expr, var) - Encuentra las raíces. Ej: resolver(x^2 - 4, x)",
        "sonify": "💡 sonify(expr) - Genera y reproduce audio. Ej: sonify(sin(440*2*pi*t))",
        "distancia": "💡 distancia(p1, p2) - Distancia Euclidiana. Ej: distancia((0,0), (3,4))",
        "matrix": "💡 matrix([[a,b],[c,d]]) - Crea una matriz. Ej: matrix([[1,2],[3,4]])",
        "help": "💡 presiona Enter para ver la ayuda completa.",
        "clear": "💡 Limpia la pantalla.",
    }

    def compose(self) -> ComposeResult:
        """Compose the UI."""
        yield Header(show_clock=True)
        yield Static("Binary EquaLab PRO terminal", id="welcome")
        yield RichLog(id="output", markup=True, wrap=True)
        yield Static("", id="help-bar") # New Help Bar
        yield Input(
            placeholder=">>> Escribe una expresión (ej. integrate(x^2))...", 
            id="input",
            suggester=MathSuggester()
        )
        yield Footer()

    def on_mount(self) -> None:
        """Called when app starts."""
        self.title = "Binary EquaLab TUI"
        log = self.query_one(RichLog)
        log.write("[bold green]System Ready.[/] Type 'help' for commands.")
        log.write("[dim italic]Consejo: Usa 'sonify(sin(440*t))' para escuchar ecuaciones.[/dim italic]")

    @on(Input.Changed)
    def handle_input_change(self, event: Input.Changed) -> None:
        """Update help bar based on input."""
        val = event.value.strip().lower()
        help_bar = self.query_one("#help-bar", Static)
        
        # Simple prefix check
        found = False
        for cmd, doc in self.HELP_DOCS.items():
            if val.startswith(cmd):
                help_bar.update(doc)
                help_bar.styles.color = "#38bdf8" # Sky blue
                found = True
                break
        
        if not found:
            help_bar.update("")

    @on(Input.Submitted)
    def handle_input(self, event: Input.Submitted) -> None:
        """Handle input submission."""
        command = event.value.strip()
        if not command:
            return
            
        log = self.query_one(RichLog)
        input_widget = self.query_one(Input)
        help_bar = self.query_one("#help-bar", Static)
        
        # Clear help
        help_bar.update("")
        
        # Add to local history
        self.history.append(command)
        self.history_index = len(self.history)
        
        # Echo Input (Jupyter style)
        count = self.execution_count
        log.write(f"\n[bold blue]In [{count}]:[/] [white]{command}[/]")
        
        # Clear input
        input_widget.value = ""
        
        if command.lower() in ('exit', 'quit'):
            self.exit()
            return
            
        if command.lower() == 'clear':
            log.clear()
            return

        # Process logic
        try:
            result = self.engine.evaluate(command)
            
            if result is not None:
                # Pretty print result (ASCII/Unicode Art)
                pretty_result = pretty(result, use_unicode=True)
                
                # Check for audio file output (Sonify)
                if isinstance(result, str) and result.endswith('.wav'):
                    import os
                    import platform
                    if platform.system() == "Windows":
                        # Auto-play on Windows
                        try:
                            os.startfile(result)
                            log.write("[bold green]🎵 Reproduciendo audio...[/]")
                        except Exception as e:
                            log.write(f"[bold red]Error reproduciendo audio: {e}[/]")
                
                # Format output
                log.write(f"[bold orange1]Out[{count}]:[/]")
                log.write(pretty_result)
                
        except Exception as e:
            log.write(f"[bold red]Error:[/bold red] {e}")
            
        self.execution_count += 1

    def on_key(self, event: events.Key) -> None:
        """Handle global key events for history navigation."""
        input_widget = self.query_one(Input)
        
        if not self.history:
            return

        if event.key == "up":
            self.history_index = max(0, self.history_index - 1)
            if self.history_index < len(self.history):
                input_widget.value = self.history[self.history_index]
                input_widget.cursor_position = len(input_widget.value)
                event.stop() # Prevent default behavior
                
        elif event.key == "down":
            self.history_index = min(len(self.history), self.history_index + 1)
            if self.history_index < len(self.history):
                input_widget.value = self.history[self.history_index]
            else:
                input_widget.value = ""
            input_widget.cursor_position = len(input_widget.value)
            event.stop()

    def action_clear_screen(self) -> None:
        self.query_one(RichLog).clear()

if __name__ == "__main__":
    app = BinaryTUI()
    app.run()
