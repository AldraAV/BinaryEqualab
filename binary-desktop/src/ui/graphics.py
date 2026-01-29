import sys
import os
import numpy as np
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, 
                               QLineEdit, QPushButton, QLabel, QMessageBox)
from PySide6.QtCore import Qt

# Matplotlib integration
import matplotlib
matplotlib.use('QtAgg')
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg, NavigationToolbar2QT
from matplotlib.figure import Figure

# Reuse MathEngine for parsing
# Adjust path as before (shared logic)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
cli_path = os.path.join(project_root, "binary-cli")

if cli_path not in sys.path:
    sys.path.append(cli_path)

try:
    from binary_equalab.engine import MathEngine
    import sympy as sp
    HAS_ENGINE = True
except ImportError:
    HAS_ENGINE = False

class GraphingWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("GraphingWidget")
        
        self.engine = MathEngine() if HAS_ENGINE else None
        
        # Main Layout
        layout = QVBoxLayout(self)
        
        # --- Controls ---
        controls_layout = QHBoxLayout()
        
        # Function Input
        self.inputFunction = QLineEdit()
        self.inputFunction.setPlaceholderText("f(x) = ... (ej: sin(x), x^2, exp(-x)*cos(x))")
        self.inputFunction.setStyleSheet("""
            QLineEdit {
                background-color: #2b2b2b;
                color: #EA580C; 
                border: 1px solid #333;
                border-radius: 4px;
                padding: 8px;
                font-family: 'Consolas', 'Cascadia Code', monospace;
                font-size: 14px;
                font-weight: bold;
            }
        """)
        
        # Plot Button
        self.btnPlot = QPushButton("Graficar")
        self.btnPlot.setStyleSheet("""
            QPushButton {
                background-color: #EA580C;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #f97316;
            }
            QPushButton:pressed {
                background-color: #c2410c;
            }
        """)
        
        controls_layout.addWidget(QLabel("f(x) ="))
        controls_layout.addWidget(self.inputFunction)
        controls_layout.addWidget(self.btnPlot)
        
        layout.addLayout(controls_layout)
        
        # --- Matplotlib Canvas ---
        # Dark theme for plot
        self.figure = Figure(figsize=(5, 4), dpi=100, facecolor='#1a1a1a')
        self.canvas = FigureCanvasQTAgg(self.figure)
        self.ax = self.figure.add_subplot(111)
        
        # Initial Plot styling
        self.style_plot()
        
        layout.addWidget(self.canvas)
        
        # Toolbar
        self.toolbar = NavigationToolbar2QT(self.canvas, self)
        self.toolbar.setStyleSheet("background-color: #ccc; color: black;")
        layout.addWidget(self.toolbar)
        
        # Connections
        self.btnPlot.clicked.connect(self.plot_function)
        self.inputFunction.returnPressed.connect(self.plot_function)

    def style_plot(self):
        self.ax.set_facecolor('#1a1a1a')
        self.ax.tick_params(colors='white')
        self.ax.xaxis.label.set_color('white')
        self.ax.yaxis.label.set_color('white')
        self.ax.spines['bottom'].set_color('white')
        self.ax.spines['top'].set_color('white') 
        self.ax.spines['left'].set_color('white')
        self.ax.spines['right'].set_color('white')
        self.ax.grid(True, linestyle='--', alpha=0.3)

    def plot_function(self):
        if not self.engine:
            return

        expr_str = self.inputFunction.text().strip()
        if not expr_str:
            return

        try:
            # Parse expression
            expr = self.engine.parse(expr_str)
            
            # Generate numerical function (lambdify)
            x_sym = sp.Symbol('x')
            f = sp.lambdify(x_sym, expr, modules=['numpy'])
            
            # Generate X values
            x_val = np.linspace(-10, 10, 400)
            
            # Safe evaluation
            try:
                y_val = f(x_val)
            except Exception as e:
                # Handle cases where function returns constant
                y_val = np.full_like(x_val, float(expr))
            
            # Clear and plot
            self.ax.clear()
            self.style_plot()
            
            self.ax.plot(x_val, y_val, color='#EA580C', linewidth=2, label=f'f(x)={expr_str}')
            self.ax.legend(facecolor='#1a1a1a', labelcolor='white')
            
            self.canvas.draw()
            
        except Exception as e:
            QMessageBox.critical(self, "Error de Graficación", str(e))
