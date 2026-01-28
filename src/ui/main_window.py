"""
Binary EquaLab - Main Window (Desktop PyQt6)

Ventana principal con modos: Console (CAS), Graphing, Matrix.
Usa el motor SymPy de src/core/engine.py.
"""
import sys
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTabWidget, QToolBar, QStatusBar, QLabel,
    QLineEdit, QTextEdit, QPushButton, QSplitter,
    QListWidget, QListWidgetItem, QStackedWidget,
    QFrame, QSizePolicy, QComboBox
)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QFont, QAction, QIcon

from src.core.engine import EquaEngine
from src.utils.constants import AppConfig, AuroraPalette


class ConsoleWidget(QWidget):
    """Widget del modo Consola (CAS interactivo)."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.engine = EquaEngine()
        self.history = []
        # User-defined variables + ANS
        self.user_variables = {'ans': '0'}
        # Display mode: 'exact' or 'approx'
        self.display_mode = 'exact'
        self._setup_ui()
    
    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)
        
        # Header
        header = QLabel("Console Mode")
        header.setStyleSheet(f"""
            font-size: 24px;
            font-weight: bold;
            color: {AuroraPalette.SECONDARY};
            padding-bottom: 8px;
        """)
        layout.addWidget(header)
        
        # Output Area (History)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.output.setPlaceholderText("Resultados aqui...")
        self.output.setStyleSheet(f"""
            QTextEdit {{
                font-family: 'Consolas', 'Fira Code', monospace;
                font-size: 14px;
                background-color: {AuroraPalette.BACKGROUND_DARK};
                border: 1px solid {AuroraPalette.BORDER};
                border-radius: 8px;
                padding: 12px;
            }}
        """)
        layout.addWidget(self.output, stretch=1)
        
        # Input Area
        input_frame = QFrame()
        input_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {AuroraPalette.BACKGROUND_LIGHT};
                border: 1px solid {AuroraPalette.BORDER};
                border-radius: 8px;
                padding: 8px;
            }}
        """)
        input_layout = QHBoxLayout(input_frame)
        input_layout.setContentsMargins(8, 8, 8, 8)
        
        prompt_label = QLabel(">>>")
        prompt_label.setStyleSheet(f"color: {AuroraPalette.SECONDARY}; font-weight: bold;")
        input_layout.addWidget(prompt_label)
        
        self.input = QLineEdit()
        self.input.setPlaceholderText("Escribe una expresion... (ej: simplify((x^2-1)/(x-1)))")
        self.input.setStyleSheet(f"""
            QLineEdit {{
                background-color: {AuroraPalette.BACKGROUND_DARK};
                border: none;
                font-family: 'Consolas', monospace;
                font-size: 16px;
                padding: 8px;
            }}
        """)
        self.input.returnPressed.connect(self._on_submit)
        input_layout.addWidget(self.input, stretch=1)
        
        submit_btn = QPushButton("Ejecutar")
        submit_btn.setProperty("class", "primary")
        submit_btn.clicked.connect(self._on_submit)
        input_layout.addWidget(submit_btn)
        
        layout.addWidget(input_frame)
        
        # Quick Buttons Row
        quick_frame = QFrame()
        quick_layout = QHBoxLayout(quick_frame)
        quick_layout.setContentsMargins(0, 8, 0, 0)
        quick_layout.setSpacing(8)
        
        quick_commands = [
            ("simplify()", "simplify()"),
            ("expand()", "expand()"),
            ("factor()", "factor()"),
            ("diff(,x)", "diff(,x)"),
            ("integrate(,x)", "integrate(,x)"),
            ("solve(,x)", "solve(,x)"),
            ("limit(,x,0)", "limit(,x,0)"),
            ("taylor(,x,0,5)", "taylor(,x,0,5)"),
        ]
        
        for label, cmd in quick_commands:
            btn = QPushButton(label)
            btn.setFixedHeight(32)
            btn.setStyleSheet("font-size: 12px; padding: 4px 8px;")
            btn.clicked.connect(lambda checked, c=cmd: self._insert_command(c))
            quick_layout.addWidget(btn)
        
        quick_layout.addStretch()
        
        # EXACT/APPROX Toggle Button
        self.toggle_btn = QPushButton("EXACT")
        self.toggle_btn.setFixedHeight(32)
        self.toggle_btn.setCheckable(True)
        self.toggle_btn.setStyleSheet(f"""
            QPushButton {{
                font-size: 11px;
                font-weight: bold;
                padding: 4px 12px;
                background-color: {AuroraPalette.SECONDARY}30;
                border: 1px solid {AuroraPalette.SECONDARY};
                border-radius: 4px;
            }}
            QPushButton:checked {{
                background-color: {AuroraPalette.PRIMARY}30;
                border-color: {AuroraPalette.PRIMARY};
            }}
        """)
        self.toggle_btn.clicked.connect(self._toggle_display_mode)
        quick_layout.addWidget(self.toggle_btn)
        
        layout.addWidget(quick_frame)
    
    def _insert_command(self, cmd):
        """Inserta un comando en el input."""
        current = self.input.text().strip()
        if current:
            new_text = cmd.replace("()", f"({current})").replace("(,", f"({current},")
        else:
            new_text = cmd
        self.input.setText(new_text)
        self.input.setFocus()
    
    def _toggle_display_mode(self):
        """Toggle between exact (symbolic) and approx (numeric) display."""
        if self.display_mode == 'exact':
            self.display_mode = 'approx'
            self.toggle_btn.setText("≈ APPROX")
            self.toggle_btn.setChecked(True)
        else:
            self.display_mode = 'exact'
            self.toggle_btn.setText("EXACT")
            self.toggle_btn.setChecked(False)
    
    def _on_submit(self):
        """Procesa el input del usuario."""
        expr_str = self.input.text().strip()
        if not expr_str:
            return
        
        self.history.append(expr_str)
        
        # Check for variable assignment: var = expr
        import re
        assignment_match = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$', expr_str)
        
        if assignment_match:
            var_name = assignment_match.group(1).lower()
            value_expr = assignment_match.group(2)
            result = self._evaluate(value_expr)
            # Store variable (try to get clean value)
            self.user_variables[var_name] = str(result)
            self.user_variables['ans'] = str(result)
            display_expr = f"{var_name} = {value_expr}"
        else:
            result = self._evaluate(expr_str)
            # Update ANS
            self.user_variables['ans'] = str(result)
            display_expr = expr_str
        
        # Format output based on display mode
        if self.display_mode == 'approx':
            try:
                from sympy import N
                numeric_result = N(result, 10)
                display_result = f"≈ {numeric_result}"
            except:
                display_result = str(result)
        else:
            display_result = str(result)
        
        self.output.append(f">>> {display_expr}")
        self.output.append(f"    {display_result}")
        self.output.append("")
        
        self.input.clear()
    
    def _evaluate(self, expr_str):
        """Evalua la expresion usando el engine."""
        import re
        
        # Substitute user variables (including ans)
        substituted = expr_str
        sorted_vars = sorted(self.user_variables.items(), key=lambda x: -len(x[0]))
        for name, value in sorted_vars:
            pattern = rf'\b{name}\b'
            substituted = re.sub(pattern, f'({value})', substituted, flags=re.IGNORECASE)
        
        try:
            if substituted.startswith("simplify("):
                inner = substituted[9:-1]
                return str(self.engine.simplify(inner))
            elif substituted.startswith("expand("):
                inner = substituted[7:-1]
                return str(self.engine.expand(inner))
            elif substituted.startswith("factor("):
                inner = substituted[7:-1]
                return str(self.engine.factor(inner))
            elif substituted.startswith("diff("):
                parts = substituted[5:-1].rsplit(",", 1)
                if len(parts) == 2:
                    return str(self.engine.derivative(parts[0].strip(), parts[1].strip()))
                return str(self.engine.derivative(parts[0].strip()))
            elif substituted.startswith("integrate("):
                parts = substituted[10:-1].rsplit(",", 1)
                if len(parts) == 2:
                    return str(self.engine.integral(parts[0].strip(), parts[1].strip()))
                return str(self.engine.integral(parts[0].strip()))
            elif substituted.startswith("solve("):
                parts = substituted[6:-1].rsplit(",", 1)
                if len(parts) == 2:
                    return str(self.engine.solve(parts[0].strip(), parts[1].strip()))
                return str(self.engine.solve(parts[0].strip()))
            elif substituted.startswith("limit("):
                parts = substituted[6:-1].split(",")
                if len(parts) >= 3:
                    return str(self.engine.limit(parts[0].strip(), parts[1].strip(), float(parts[2].strip())))
                return str(self.engine.limit(parts[0].strip()))
            elif substituted.startswith("taylor("):
                parts = substituted[7:-1].split(",")
                if len(parts) >= 4:
                    return str(self.engine.taylor(parts[0].strip(), parts[1].strip(), float(parts[2].strip()), int(parts[3].strip())))
                return str(self.engine.taylor(parts[0].strip()))
            elif substituted.startswith("laplace("):
                inner = substituted[8:-1]
                return str(self.engine.laplace(inner))
            elif substituted.startswith("ilaplace("):
                inner = substituted[9:-1]
                return str(self.engine.inverse_laplace(inner))
            elif substituted.startswith("latex("):
                inner = substituted[6:-1]
                return str(self.engine.to_latex(inner))
            else:
                result = self.engine.parse_expression(substituted)
                return str(result)
        except Exception as e:
            return f"Error: {str(e)}"


class GraphingWidget(QWidget):
    """Widget avanzado de graficación con derivadas, integrales, zoom/pan y análisis."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.engine = EquaEngine()
        self.functions = []  # List of (expr_str, color, sympy_expr)
        self.x_min, self.x_max = -10, 10
        self.y_min, self.y_max = -10, 10
        self._setup_ui()
    
    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(10)
        
        header = QLabel("Graphing Mode")
        header.setStyleSheet(f"""
            font-size: 24px;
            font-weight: bold;
            color: {AuroraPalette.SECONDARY};
        """)
        layout.addWidget(header)
        
        # === Top Controls ===
        top_frame = QFrame()
        top_layout = QHBoxLayout(top_frame)
        top_layout.setContentsMargins(0, 0, 0, 0)
        
        # Function Input
        input_frame = QFrame()
        input_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {AuroraPalette.BACKGROUND_LIGHT};
                border: 1px solid {AuroraPalette.BORDER};
                border-radius: 8px;
                padding: 4px;
            }}
        """)
        input_layout = QHBoxLayout(input_frame)
        input_layout.setContentsMargins(8, 4, 8, 4)
        
        label = QLabel("f(x) =")
        label.setStyleSheet(f"color: {AuroraPalette.SECONDARY}; font-weight: bold;")
        input_layout.addWidget(label)
        
        self.func_input = QLineEdit()
        self.func_input.setPlaceholderText("sin(x), x^2, exp(-x^2), etc.")
        self.func_input.setStyleSheet(f"""
            QLineEdit {{
                background-color: {AuroraPalette.BACKGROUND_DARK};
                border: none;
                font-family: 'Consolas', monospace;
                font-size: 14px;
                padding: 6px;
            }}
        """)
        self.func_input.returnPressed.connect(self._add_function)
        input_layout.addWidget(self.func_input, stretch=1)
        
        top_layout.addWidget(input_frame, stretch=1)
        
        # Add buttons
        add_btn = QPushButton("Plot")
        add_btn.setProperty("class", "primary")
        add_btn.clicked.connect(self._add_function)
        top_layout.addWidget(add_btn)
        
        deriv_btn = QPushButton("f'(x)")
        deriv_btn.setToolTip("Plot derivative")
        deriv_btn.clicked.connect(self._plot_derivative)
        top_layout.addWidget(deriv_btn)
        
        integ_btn = QPushButton("∫f(x)")
        integ_btn.setToolTip("Plot integral")
        integ_btn.clicked.connect(self._plot_integral)
        top_layout.addWidget(integ_btn)
        
        layout.addWidget(top_frame)
        
        # === Range Controls ===
        range_frame = QFrame()
        range_layout = QHBoxLayout(range_frame)
        range_layout.setContentsMargins(0, 0, 0, 0)
        range_layout.setSpacing(8)
        
        range_layout.addWidget(QLabel("X:"))
        self.x_min_input = QLineEdit("-10")
        self.x_min_input.setFixedWidth(50)
        self.x_min_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        range_layout.addWidget(self.x_min_input)
        range_layout.addWidget(QLabel("to"))
        self.x_max_input = QLineEdit("10")
        self.x_max_input.setFixedWidth(50)
        self.x_max_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        range_layout.addWidget(self.x_max_input)
        
        range_layout.addWidget(QLabel("   Y:"))
        self.y_min_input = QLineEdit("-10")
        self.y_min_input.setFixedWidth(50)
        self.y_min_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        range_layout.addWidget(self.y_min_input)
        range_layout.addWidget(QLabel("to"))
        self.y_max_input = QLineEdit("10")
        self.y_max_input.setFixedWidth(50)
        self.y_max_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        range_layout.addWidget(self.y_max_input)
        
        apply_range_btn = QPushButton("Apply")
        apply_range_btn.clicked.connect(self._apply_range)
        range_layout.addWidget(apply_range_btn)
        
        # Zoom buttons
        zoom_in_btn = QPushButton("🔍+")
        zoom_in_btn.setFixedWidth(40)
        zoom_in_btn.clicked.connect(self._zoom_in)
        range_layout.addWidget(zoom_in_btn)
        
        zoom_out_btn = QPushButton("🔍-")
        zoom_out_btn.setFixedWidth(40)
        zoom_out_btn.clicked.connect(self._zoom_out)
        range_layout.addWidget(zoom_out_btn)
        
        reset_btn = QPushButton("Reset")
        reset_btn.clicked.connect(self._reset_view)
        range_layout.addWidget(reset_btn)
        
        # Presets dropdown
        range_layout.addWidget(QLabel("  Presets:"))
        self.presets_combo = QComboBox()
        self.presets_combo.addItems([
            "-- Select --",
            "sin(x)", "cos(x)", "tan(x)",
            "x^2", "x^3", "sqrt(x)",
            "exp(x)", "log(x)", "1/x",
            "sin(x)/x", "exp(-x^2)",
            "abs(x)", "floor(x)"
        ])
        self.presets_combo.currentIndexChanged.connect(self._apply_preset)
        range_layout.addWidget(self.presets_combo)
        
        # Export button
        export_btn = QPushButton("📷 Export")
        export_btn.setToolTip("Save graph as PNG")
        export_btn.clicked.connect(self._export_graph)
        range_layout.addWidget(export_btn)
        
        range_layout.addStretch()
        layout.addWidget(range_frame)
        
        # === Matplotlib Canvas ===
        try:
            from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg
            from matplotlib.figure import Figure
            
            self.figure = Figure(figsize=(10, 6), facecolor=AuroraPalette.BACKGROUND_DARK)
            self.ax = self.figure.add_subplot(111)
            self._style_axes()
            
            self.canvas = FigureCanvasQTAgg(self.figure)
            self.canvas.setStyleSheet("border-radius: 8px;")
            layout.addWidget(self.canvas, stretch=1)
        except ImportError:
            placeholder = QLabel("Matplotlib no instalado.\npip install matplotlib")
            placeholder.setAlignment(Qt.AlignmentFlag.AlignCenter)
            placeholder.setStyleSheet(f"color: {AuroraPalette.TEXT_SECONDARY}; font-size: 16px;")
            layout.addWidget(placeholder, stretch=1)
            self.canvas = None
        
        # === Bottom Controls: Functions List + Analysis ===
        bottom_frame = QFrame()
        bottom_layout = QHBoxLayout(bottom_frame)
        bottom_layout.setContentsMargins(0, 0, 0, 0)
        
        # Functions List
        list_frame = QFrame()
        list_layout = QVBoxLayout(list_frame)
        list_layout.setContentsMargins(0, 0, 0, 0)
        
        list_label = QLabel("Functions:")
        list_label.setStyleSheet("font-weight: bold;")
        list_layout.addWidget(list_label)
        
        self.func_list = QListWidget()
        self.func_list.setMaximumHeight(80)
        self.func_list.setStyleSheet(f"""
            QListWidget {{
                background-color: {AuroraPalette.BACKGROUND_DARK};
                border: 1px solid {AuroraPalette.BORDER};
                border-radius: 6px;
                font-family: 'Consolas', monospace;
            }}
        """)
        list_layout.addWidget(self.func_list)
        
        # List buttons
        list_btns = QFrame()
        list_btns_layout = QHBoxLayout(list_btns)
        list_btns_layout.setContentsMargins(0, 4, 0, 0)
        
        remove_btn = QPushButton("Remove")
        remove_btn.clicked.connect(self._remove_selected)
        list_btns_layout.addWidget(remove_btn)
        
        clear_btn = QPushButton("Clear All")
        clear_btn.clicked.connect(self._clear_functions)
        list_btns_layout.addWidget(clear_btn)
        
        list_btns_layout.addStretch()
        list_layout.addWidget(list_btns)
        
        bottom_layout.addWidget(list_frame, stretch=1)
        
        # Analysis Panel
        analysis_frame = QFrame()
        analysis_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {AuroraPalette.BACKGROUND_DARK};
                border: 1px solid {AuroraPalette.BORDER};
                border-radius: 6px;
                padding: 8px;
            }}
        """)
        analysis_layout = QVBoxLayout(analysis_frame)
        analysis_layout.setContentsMargins(8, 4, 8, 4)
        
        analysis_label = QLabel("Analysis (selected function):")
        analysis_label.setStyleSheet("font-weight: bold;")
        analysis_layout.addWidget(analysis_label)
        
        analysis_btns = QFrame()
        analysis_btns.setStyleSheet("background: transparent; border: none;")
        analysis_btns_layout = QHBoxLayout(analysis_btns)
        analysis_btns_layout.setContentsMargins(0, 0, 0, 0)
        
        roots_btn = QPushButton("Roots")
        roots_btn.setToolTip("Find zeros of the function")
        roots_btn.clicked.connect(self._find_roots)
        analysis_btns_layout.addWidget(roots_btn)
        
        extrema_btn = QPushButton("Extrema")
        extrema_btn.setToolTip("Find local min/max")
        extrema_btn.clicked.connect(self._find_extrema)
        analysis_btns_layout.addWidget(extrema_btn)
        
        area_btn = QPushButton("Area")
        area_btn.setToolTip("Calculate definite integral")
        area_btn.clicked.connect(self._calc_area)
        analysis_btns_layout.addWidget(area_btn)
        
        analysis_layout.addWidget(analysis_btns)
        
        self.analysis_output = QLabel("")
        self.analysis_output.setStyleSheet(f"""
            font-family: 'Consolas', monospace;
            color: {AuroraPalette.TEXT_SECONDARY};
            font-size: 12px;
        """)
        self.analysis_output.setWordWrap(True)
        analysis_layout.addWidget(self.analysis_output)
        
        bottom_layout.addWidget(analysis_frame, stretch=1)
        
        layout.addWidget(bottom_frame)
    
    def _style_axes(self):
        """Aplica estilo Aurora al grafico."""
        self.ax.set_facecolor(AuroraPalette.BACKGROUND_DARK)
        self.ax.tick_params(colors=AuroraPalette.TEXT_SECONDARY)
        for spine in self.ax.spines.values():
            spine.set_color(AuroraPalette.BORDER)
        self.ax.grid(True, alpha=0.2, color=AuroraPalette.BORDER)
        self.ax.axhline(y=0, color=AuroraPalette.BORDER, linewidth=0.8)
        self.ax.axvline(x=0, color=AuroraPalette.BORDER, linewidth=0.8)
        self.ax.set_xlim(self.x_min, self.x_max)
        self.ax.set_ylim(self.y_min, self.y_max)
    
    def _get_colors(self):
        return ['#FF6B9D', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#A8E6CF', '#DDA0DD']
    
    def _add_function(self):
        """Agrega una funcion al grafico."""
        expr_str = self.func_input.text().strip()
        if not expr_str or not self.canvas:
            return
        self._plot_expression(expr_str, f"f(x) = {expr_str}")
        self.func_input.clear()
    
    def _plot_expression(self, expr_str: str, label: str, linestyle='-'):
        """Plots an expression on the graph."""
        import numpy as np
        colors = self._get_colors()
        color = colors[len(self.functions) % len(colors)]
        
        try:
            x = np.linspace(self.x_min, self.x_max, 1000)
            expr = self.engine.parse_expression(expr_str)
            from sympy import lambdify, Symbol
            x_sym = Symbol('x')
            f = lambdify(x_sym, expr, modules=['numpy'])
            y = f(x)
            
            # Handle infinities and NaNs
            y = np.where(np.isfinite(y), y, np.nan)
            
            self.ax.plot(x, y, color=color, linewidth=2, label=label, linestyle=linestyle)
            self.ax.legend(loc='upper right', facecolor=AuroraPalette.BACKGROUND_LIGHT, 
                          fontsize=9, framealpha=0.9)
            self.ax.set_xlim(self.x_min, self.x_max)
            self.ax.set_ylim(self.y_min, self.y_max)
            self.canvas.draw()
            
            self.functions.append((expr_str, color, expr))
            self.func_list.addItem(f"● {label}")
        except Exception as e:
            self.analysis_output.setText(f"Error: {str(e)}")
    
    def _plot_derivative(self):
        """Plots derivative of current input."""
        expr_str = self.func_input.text().strip()
        if not expr_str:
            return
        try:
            from sympy import diff, Symbol
            expr = self.engine.parse_expression(expr_str)
            deriv = diff(expr, Symbol('x'))
            self._plot_expression(str(deriv), f"f'(x) = {deriv}", linestyle='--')
            self.func_input.clear()
        except Exception as e:
            self.analysis_output.setText(f"Error: {str(e)}")
    
    def _plot_integral(self):
        """Plots integral of current input."""
        expr_str = self.func_input.text().strip()
        if not expr_str:
            return
        try:
            from sympy import integrate, Symbol
            expr = self.engine.parse_expression(expr_str)
            integ = integrate(expr, Symbol('x'))
            self._plot_expression(str(integ), f"∫f(x) = {integ}", linestyle=':')
            self.func_input.clear()
        except Exception as e:
            self.analysis_output.setText(f"Error: {str(e)}")
    
    def _apply_range(self):
        """Applies the range from input fields."""
        try:
            self.x_min = float(self.x_min_input.text())
            self.x_max = float(self.x_max_input.text())
            self.y_min = float(self.y_min_input.text())
            self.y_max = float(self.y_max_input.text())
            self._redraw_all()
        except ValueError:
            pass
    
    def _zoom_in(self):
        """Zoom in by 20%."""
        cx = (self.x_min + self.x_max) / 2
        cy = (self.y_min + self.y_max) / 2
        dx = (self.x_max - self.x_min) * 0.4
        dy = (self.y_max - self.y_min) * 0.4
        self.x_min, self.x_max = cx - dx, cx + dx
        self.y_min, self.y_max = cy - dy, cy + dy
        self._update_range_inputs()
        self._redraw_all()
    
    def _zoom_out(self):
        """Zoom out by 25%."""
        cx = (self.x_min + self.x_max) / 2
        cy = (self.y_min + self.y_max) / 2
        dx = (self.x_max - self.x_min) * 0.625
        dy = (self.y_max - self.y_min) * 0.625
        self.x_min, self.x_max = cx - dx, cx + dx
        self.y_min, self.y_max = cy - dy, cy + dy
        self._update_range_inputs()
        self._redraw_all()
    
    def _reset_view(self):
        """Reset to default view."""
        self.x_min, self.x_max = -10, 10
        self.y_min, self.y_max = -10, 10
        self._update_range_inputs()
        self._redraw_all()
    
    def _update_range_inputs(self):
        """Update the range input fields."""
        self.x_min_input.setText(f"{self.x_min:.1f}")
        self.x_max_input.setText(f"{self.x_max:.1f}")
        self.y_min_input.setText(f"{self.y_min:.1f}")
        self.y_max_input.setText(f"{self.y_max:.1f}")
    
    def _redraw_all(self):
        """Redraw all functions with current range."""
        if not self.canvas:
            return
        self.ax.clear()
        self._style_axes()
        
        import numpy as np
        from sympy import lambdify, Symbol
        x_sym = Symbol('x')
        x = np.linspace(self.x_min, self.x_max, 1000)
        
        for i, (expr_str, color, expr) in enumerate(self.functions):
            try:
                f = lambdify(x_sym, expr, modules=['numpy'])
                y = f(x)
                y = np.where(np.isfinite(y), y, np.nan)
                label = self.func_list.item(i).text() if i < self.func_list.count() else expr_str
                self.ax.plot(x, y, color=color, linewidth=2, label=label[2:])  # Remove bullet
            except:
                pass
        
        if self.functions:
            self.ax.legend(loc='upper right', facecolor=AuroraPalette.BACKGROUND_LIGHT, fontsize=9)
        self.canvas.draw()
    
    def _remove_selected(self):
        """Remove selected function from list and graph."""
        row = self.func_list.currentRow()
        if row >= 0 and row < len(self.functions):
            self.functions.pop(row)
            self.func_list.takeItem(row)
            self._redraw_all()
    
    def _clear_functions(self):
        """Limpia todas las funciones."""
        if self.canvas:
            self.ax.clear()
            self._style_axes()
            self.canvas.draw()
        self.functions.clear()
        self.func_list.clear()
        self.analysis_output.setText("")
    
    def _get_selected_function(self):
        """Returns the selected function's sympy expression."""
        row = self.func_list.currentRow()
        if row >= 0 and row < len(self.functions):
            return self.functions[row][2]
        elif self.functions:
            return self.functions[-1][2]  # Last function if none selected
        return None
    
    def _find_roots(self):
        """Find roots of selected function."""
        expr = self._get_selected_function()
        if expr is None:
            self.analysis_output.setText("No function selected")
            return
        try:
            from sympy import solve, Symbol, N
            roots = solve(expr, Symbol('x'))
            # Evaluate numerically and filter real roots in range
            real_roots = []
            for r in roots[:10]:  # Limit to 10
                try:
                    val = complex(N(r))
                    if abs(val.imag) < 1e-10:
                        real_roots.append(f"{val.real:.4f}")
                except:
                    real_roots.append(str(r))
            self.analysis_output.setText(f"Roots: {', '.join(real_roots) if real_roots else 'None found'}")
        except Exception as e:
            self.analysis_output.setText(f"Error: {str(e)}")
    
    def _find_extrema(self):
        """Find local extrema of selected function."""
        expr = self._get_selected_function()
        if expr is None:
            self.analysis_output.setText("No function selected")
            return
        try:
            from sympy import diff, solve, Symbol, N
            x = Symbol('x')
            deriv = diff(expr, x)
            critical = solve(deriv, x)
            
            results = []
            for c in critical[:10]:
                try:
                    cx = float(N(c))
                    if self.x_min <= cx <= self.x_max:
                        cy = float(N(expr.subs(x, c)))
                        results.append(f"({cx:.2f}, {cy:.2f})")
                except:
                    pass
            self.analysis_output.setText(f"Extrema: {', '.join(results) if results else 'None in range'}")
        except Exception as e:
            self.analysis_output.setText(f"Error: {str(e)}")
    
    def _calc_area(self):
        """Calculate definite integral (area under curve)."""
        expr = self._get_selected_function()
        if expr is None:
            self.analysis_output.setText("No function selected")
            return
        try:
            from sympy import integrate, Symbol, N
            x = Symbol('x')
            result = integrate(expr, (x, self.x_min, self.x_max))
            area = float(N(result))
            self.analysis_output.setText(f"Area [{self.x_min}, {self.x_max}]: {area:.4f}")
        except Exception as e:
            self.analysis_output.setText(f"Error: {str(e)}")
    
    def _apply_preset(self, index):
        """Apply a preset function from the dropdown."""
        if index == 0:  # "-- Select --"
            return
        preset = self.presets_combo.currentText()
        self.func_input.setText(preset)
        self._add_function()
        self.presets_combo.setCurrentIndex(0)  # Reset dropdown
    
    def _export_graph(self):
        """Export the current graph as PNG."""
        if not self.canvas:
            return
        from PyQt6.QtWidgets import QFileDialog
        filename, _ = QFileDialog.getSaveFileName(
            self, "Export Graph", "graph.png", "PNG Images (*.png);;All Files (*)"
        )
        if filename:
            try:
                self.figure.savefig(filename, dpi=150, facecolor=AuroraPalette.BACKGROUND_DARK,
                                   bbox_inches='tight', pad_inches=0.2)
                self.analysis_output.setText(f"Saved: {filename}")
            except Exception as e:
                self.analysis_output.setText(f"Export error: {str(e)}")


class MatrixWidget(QWidget):
    """Widget del modo Matrices con dos matrices (A y B) y operaciones combinadas."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.engine = EquaEngine()
        # Matrix A
        self.rows_a = 3
        self.cols_a = 3
        self.cells_a = []
        # Matrix B
        self.rows_b = 3
        self.cols_b = 3
        self.cells_b = []
        self._setup_ui()
    
    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)
        
        header = QLabel("Matrix Mode")
        header.setStyleSheet(f"""
            font-size: 24px;
            font-weight: bold;
            color: {AuroraPalette.SECONDARY};
        """)
        layout.addWidget(header)
        
        # Matrices Container (A and B side by side)
        matrices_frame = QFrame()
        matrices_layout = QHBoxLayout(matrices_frame)
        matrices_layout.setSpacing(24)
        
        # Matrix A Section
        self.matrix_a_widget = self._create_matrix_section("A", "a")
        matrices_layout.addWidget(self.matrix_a_widget)
        
        # Matrix B Section
        self.matrix_b_widget = self._create_matrix_section("B", "b")
        matrices_layout.addWidget(self.matrix_b_widget)
        
        matrices_layout.addStretch()
        layout.addWidget(matrices_frame)
        
        # Build initial grids
        self._build_matrix_grid("a")
        self._build_matrix_grid("b")
        
        # Single Matrix Operations
        single_ops_label = QLabel("Single Matrix Operations:")
        single_ops_label.setStyleSheet("font-weight: bold; margin-top: 8px;")
        layout.addWidget(single_ops_label)
        
        single_ops_frame = QFrame()
        single_ops_layout = QHBoxLayout(single_ops_frame)
        single_ops_layout.setContentsMargins(0, 0, 0, 0)
        
        # Selector for which matrix
        single_ops_layout.addWidget(QLabel("On:"))
        self.matrix_selector = QComboBox()
        self.matrix_selector.addItems(["Matrix A", "Matrix B"])
        self.matrix_selector.setFixedWidth(100)
        single_ops_layout.addWidget(self.matrix_selector)
        
        single_operations = [
            ("det", self._calc_det),
            ("inv", self._calc_inv),
            ("T", self._calc_transpose),
            ("eigenvals", self._calc_eigenvals),
            ("rref", self._calc_rref),
            ("rank", self._calc_rank),
            ("trace", self._calc_trace),
        ]
        
        for label, func in single_operations:
            btn = QPushButton(label)
            btn.setProperty("class", "secondary")
            btn.setFixedWidth(70)
            btn.clicked.connect(func)
            single_ops_layout.addWidget(btn)
        
        single_ops_layout.addStretch()
        layout.addWidget(single_ops_frame)
        
        # Combined Operations (A op B)
        combined_ops_label = QLabel("Combined Operations (A ⊕ B):")
        combined_ops_label.setStyleSheet("font-weight: bold; margin-top: 8px;")
        layout.addWidget(combined_ops_label)
        
        combined_ops_frame = QFrame()
        combined_ops_layout = QHBoxLayout(combined_ops_frame)
        combined_ops_layout.setContentsMargins(0, 0, 0, 0)
        
        combined_operations = [
            ("A + B", self._calc_add),
            ("A - B", self._calc_sub),
            ("A × B", self._calc_mul),
            ("A ÷ B", self._calc_div),  # A × inv(B)
            ("A | B", self._calc_augment),  # Augmented matrix
        ]
        
        for label, func in combined_operations:
            btn = QPushButton(label)
            btn.setProperty("class", "primary")
            btn.setFixedWidth(70)
            btn.clicked.connect(func)
            combined_ops_layout.addWidget(btn)
        
        # Copy result buttons
        combined_ops_layout.addWidget(QLabel("  Copy to:"))
        copy_a_btn = QPushButton("→ A")
        copy_a_btn.clicked.connect(lambda: self._copy_result_to("a"))
        combined_ops_layout.addWidget(copy_a_btn)
        copy_b_btn = QPushButton("→ B")
        copy_b_btn.clicked.connect(lambda: self._copy_result_to("b"))
        combined_ops_layout.addWidget(copy_b_btn)
        
        combined_ops_layout.addStretch()
        layout.addWidget(combined_ops_frame)
        
        # Results Area
        self.results = QTextEdit()
        self.results.setReadOnly(True)
        self.results.setMaximumHeight(180)
        self.results.setPlaceholderText("Resultados aparecen aquí...")
        self.results.setStyleSheet(f"""
            QTextEdit {{
                font-family: 'Consolas', monospace;
                font-size: 14px;
                background-color: {AuroraPalette.BACKGROUND_DARK};
                border: 1px solid {AuroraPalette.BORDER};
                border-radius: 8px;
                padding: 8px;
            }}
        """)
        layout.addWidget(self.results)
        
        # Store last result for copy
        self.last_result = None
    
    def _create_matrix_section(self, name: str, key: str) -> QFrame:
        """Creates a matrix section with label, size controls, and grid."""
        section = QFrame()
        section.setStyleSheet(f"""
            QFrame {{
                background-color: {AuroraPalette.BACKGROUND_DARK};
                border: 1px solid {AuroraPalette.BORDER};
                border-radius: 8px;
                padding: 12px;
            }}
        """)
        layout = QVBoxLayout(section)
        layout.setSpacing(8)
        
        # Header
        header = QLabel(f"Matrix {name}")
        header.setStyleSheet(f"font-size: 16px; font-weight: bold; color: {AuroraPalette.PRIMARY};")
        layout.addWidget(header)
        
        # Size controls
        size_frame = QFrame()
        size_frame.setStyleSheet("background: transparent; border: none;")
        size_layout = QHBoxLayout(size_frame)
        size_layout.setContentsMargins(0, 0, 0, 0)
        
        rows_input = QLineEdit("3")
        rows_input.setFixedWidth(40)
        rows_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        setattr(self, f"rows_input_{key}", rows_input)
        
        cols_input = QLineEdit("3")
        cols_input.setFixedWidth(40)
        cols_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        setattr(self, f"cols_input_{key}", cols_input)
        
        size_layout.addWidget(rows_input)
        size_layout.addWidget(QLabel("×"))
        size_layout.addWidget(cols_input)
        
        apply_btn = QPushButton("✓")
        apply_btn.setFixedWidth(30)
        apply_btn.clicked.connect(lambda: self._resize_matrix(key))
        size_layout.addWidget(apply_btn)
        size_layout.addStretch()
        
        layout.addWidget(size_frame)
        
        # Grid container
        grid_container = QFrame()
        grid_container.setStyleSheet("background: transparent; border: none;")
        grid_layout = QHBoxLayout(grid_container)
        grid_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        setattr(self, f"grid_layout_{key}", grid_layout)
        setattr(self, f"grid_container_{key}", grid_container)
        
        layout.addWidget(grid_container)
        return section
    
    def _build_matrix_grid(self, key: str):
        """Builds the matrix grid for A or B."""
        rows = getattr(self, f"rows_{key}")
        cols = getattr(self, f"cols_{key}")
        cells = getattr(self, f"cells_{key}")
        grid_layout = getattr(self, f"grid_layout_{key}")
        
        # Clear existing
        for row in cells:
            for cell in row:
                cell.deleteLater()
        cells.clear()
        
        while grid_layout.count():
            item = grid_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        
        from PyQt6.QtWidgets import QGridLayout
        grid = QWidget()
        grid_inner = QGridLayout(grid)
        grid_inner.setSpacing(3)
        
        for r in range(rows):
            row_cells = []
            for c in range(cols):
                cell = QLineEdit("0")
                cell.setFixedSize(45, 35)
                cell.setAlignment(Qt.AlignmentFlag.AlignCenter)
                cell.setStyleSheet(f"""
                    QLineEdit {{
                        background-color: {AuroraPalette.BACKGROUND_LIGHT};
                        border: 1px solid {AuroraPalette.BORDER};
                        border-radius: 3px;
                        font-family: 'Consolas', monospace;
                        font-size: 12px;
                    }}
                    QLineEdit:focus {{
                        border-color: {AuroraPalette.SECONDARY};
                    }}
                """)
                grid_inner.addWidget(cell, r, c)
                row_cells.append(cell)
            cells.append(row_cells)
        
        grid_layout.addWidget(grid)
        setattr(self, f"cells_{key}", cells)
    
    def _resize_matrix(self, key: str):
        """Resizes a matrix grid."""
        try:
            rows_input = getattr(self, f"rows_input_{key}")
            cols_input = getattr(self, f"cols_input_{key}")
            rows = max(1, min(8, int(rows_input.text())))
            cols = max(1, min(8, int(cols_input.text())))
            setattr(self, f"rows_{key}", rows)
            setattr(self, f"cols_{key}", cols)
            self._build_matrix_grid(key)
        except ValueError:
            pass
    
    def _get_matrix_values(self, key: str):
        """Gets matrix values as list of lists."""
        cells = getattr(self, f"cells_{key}")
        values = []
        for row in cells:
            row_vals = []
            for cell in row:
                try:
                    row_vals.append(float(cell.text()))
                except ValueError:
                    row_vals.append(0)
            values.append(row_vals)
        return values
    
    def _get_sympy_matrix(self, key: str):
        """Gets SymPy Matrix object."""
        from sympy import Matrix
        return Matrix(self._get_matrix_values(key))
    
    def _selected_matrix_key(self) -> str:
        """Returns 'a' or 'b' based on selector."""
        return "a" if self.matrix_selector.currentIndex() == 0 else "b"
    
    def _selected_matrix_name(self) -> str:
        """Returns 'A' or 'B' based on selector."""
        return "A" if self.matrix_selector.currentIndex() == 0 else "B"
    
    # Single matrix operations
    def _calc_det(self):
        try:
            key = self._selected_matrix_key()
            name = self._selected_matrix_name()
            m = self._get_sympy_matrix(key)
            result = m.det()
            self.results.append(f">>> det({name}) = {result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_inv(self):
        try:
            key = self._selected_matrix_key()
            name = self._selected_matrix_name()
            m = self._get_sympy_matrix(key)
            result = m.inv()
            self.last_result = result
            self.results.append(f">>> inv({name}) =\n{result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_transpose(self):
        try:
            key = self._selected_matrix_key()
            name = self._selected_matrix_name()
            m = self._get_sympy_matrix(key)
            result = m.T
            self.last_result = result
            self.results.append(f">>> {name}ᵀ =\n{result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_eigenvals(self):
        try:
            key = self._selected_matrix_key()
            name = self._selected_matrix_name()
            m = self._get_sympy_matrix(key)
            result = m.eigenvals()
            self.results.append(f">>> eigenvals({name}) = {result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_rref(self):
        try:
            key = self._selected_matrix_key()
            name = self._selected_matrix_name()
            m = self._get_sympy_matrix(key)
            result, pivots = m.rref()
            self.last_result = result
            self.results.append(f">>> rref({name}) =\n{result}\nPivots: {pivots}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_rank(self):
        try:
            key = self._selected_matrix_key()
            name = self._selected_matrix_name()
            m = self._get_sympy_matrix(key)
            result = m.rank()
            self.results.append(f">>> rank({name}) = {result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_trace(self):
        try:
            key = self._selected_matrix_key()
            name = self._selected_matrix_name()
            m = self._get_sympy_matrix(key)
            result = m.trace()
            self.results.append(f">>> trace({name}) = {result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    # Combined operations
    def _calc_add(self):
        try:
            a = self._get_sympy_matrix("a")
            b = self._get_sympy_matrix("b")
            result = a + b
            self.last_result = result
            self.results.append(f">>> A + B =\n{result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_sub(self):
        try:
            a = self._get_sympy_matrix("a")
            b = self._get_sympy_matrix("b")
            result = a - b
            self.last_result = result
            self.results.append(f">>> A - B =\n{result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_mul(self):
        try:
            a = self._get_sympy_matrix("a")
            b = self._get_sympy_matrix("b")
            result = a * b
            self.last_result = result
            self.results.append(f">>> A × B =\n{result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_div(self):
        try:
            a = self._get_sympy_matrix("a")
            b = self._get_sympy_matrix("b")
            result = a * b.inv()
            self.last_result = result
            self.results.append(f">>> A × B⁻¹ =\n{result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _calc_augment(self):
        try:
            a = self._get_sympy_matrix("a")
            b = self._get_sympy_matrix("b")
            result = a.row_join(b)
            self.last_result = result
            self.results.append(f">>> [A | B] =\n{result}\n")
        except Exception as e:
            self.results.append(f"Error: {e}\n")
    
    def _copy_result_to(self, key: str):
        """Copies last result to matrix A or B."""
        if self.last_result is None:
            self.results.append("No result to copy.\n")
            return
        try:
            rows, cols = self.last_result.shape
            setattr(self, f"rows_{key}", rows)
            setattr(self, f"cols_{key}", cols)
            getattr(self, f"rows_input_{key}").setText(str(rows))
            getattr(self, f"cols_input_{key}").setText(str(cols))
            self._build_matrix_grid(key)
            
            cells = getattr(self, f"cells_{key}")
            for r in range(rows):
                for c in range(cols):
                    cells[r][c].setText(str(float(self.last_result[r, c])))
            
            name = "A" if key == "a" else "B"
            self.results.append(f"Result copied to Matrix {name}\n")
        except Exception as e:
            self.results.append(f"Error copying: {e}\n")


class Sidebar(QWidget):
    """Sidebar con navegacion de modos."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedWidth(200)
        self._setup_ui()
    
    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 16, 8, 16)
        layout.setSpacing(4)
        
        # Logo/Title
        title = QLabel("Binary EquaLab")
        title.setStyleSheet(f"""
            font-size: 16px;
            font-weight: bold;
            color: {AuroraPalette.SECONDARY};
            padding: 16px 8px;
        """)
        layout.addWidget(title)
        
        # Navigation List
        self.nav_list = QListWidget()
        self.nav_list.setStyleSheet(f"""
            QListWidget {{
                background: transparent;
                border: none;
            }}
            QListWidget::item {{
                padding: 12px 16px;
                border-radius: 8px;
                margin: 2px 0;
            }}
            QListWidget::item:selected {{
                background-color: {AuroraPalette.BACKGROUND_LIGHT};
                border-left: 3px solid {AuroraPalette.SECONDARY};
            }}
            QListWidget::item:hover {{
                background-color: {AuroraPalette.BACKGROUND_DARK};
            }}
        """)
        
        modes = [
            ("Console", "console"),
            ("Graphing", "graphing"),
            ("Matrix", "matrix"),
        ]
        
        for label, mode_id in modes:
            item = QListWidgetItem(label)
            item.setData(Qt.ItemDataRole.UserRole, mode_id)
            self.nav_list.addItem(item)
        
        self.nav_list.setCurrentRow(0)
        layout.addWidget(self.nav_list)
        
        layout.addStretch()
        
        # Version
        version = QLabel(f"v{AppConfig.VERSION}")
        version.setStyleSheet(f"color: {AuroraPalette.TEXT_MUTED}; font-size: 11px;")
        version.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(version)


class MainWindow(QMainWindow):
    """Ventana principal de Binary EquaLab."""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle(AppConfig.APP_NAME)
        self.setMinimumSize(*AppConfig.WINDOW_SIZE)
        self._setup_ui()
    
    def _setup_ui(self):
        # Central Widget
        central = QWidget()
        self.setCentralWidget(central)
        
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Sidebar
        self.sidebar = Sidebar()
        self.sidebar.nav_list.currentRowChanged.connect(self._on_mode_changed)
        main_layout.addWidget(self.sidebar)
        
        # Separator
        separator = QFrame()
        separator.setFixedWidth(1)
        separator.setStyleSheet(f"background-color: {AuroraPalette.BORDER};")
        main_layout.addWidget(separator)
        
        # Content Stack
        self.content_stack = QStackedWidget()
        self.content_stack.addWidget(ConsoleWidget())
        self.content_stack.addWidget(GraphingWidget())
        self.content_stack.addWidget(MatrixWidget())
        main_layout.addWidget(self.content_stack, stretch=1)
        
        # Status Bar
        self.status_bar = QStatusBar()
        self.status_bar.setStyleSheet(f"""
            QStatusBar {{
                background-color: {AuroraPalette.BACKGROUND_LIGHT};
                color: {AuroraPalette.TEXT_SECONDARY};
                font-size: 12px;
                padding: 4px 12px;
            }}
        """)
        self.status_bar.showMessage("Listo | Modo: DEG | Tu luz sigue intacta")
        self.setStatusBar(self.status_bar)
    
    def _on_mode_changed(self, index):
        """Cambia el widget visible segun el modo seleccionado."""
        self.content_stack.setCurrentIndex(index)
        modes = ["Console", "Graphing", "Matrix"]
        self.status_bar.showMessage(f"Modo: {modes[index]} | DEG | Tu luz sigue intacta")
