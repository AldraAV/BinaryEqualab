import numpy as np
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QHeaderView, QGroupBox, QSplitter
)
from PySide6.QtCore import Qt
from qfluentwidgets import (
    PrimaryPushButton, PushButton, StrongBodyLabel, BodyLabel, 
    ComboBox 
)

# Matplotlib
import matplotlib
matplotlib.use('QtAgg')
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg, NavigationToolbar2QT
from matplotlib.figure import Figure

class StatisticsWidget(QWidget):
    def __init__(self):
        super().__init__()
        
        main_layout = QHBoxLayout(self)
        
        # --- LEFT: Data Input ---
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(0,0,10,0)
        
        # Controls
        controls_group = QGroupBox("Datos")
        controls_layout = QVBoxLayout(controls_group)
        
        self.btn_calc = PrimaryPushButton("Calcular Estadísticas")
        self.btn_calc.clicked.connect(self.calculate)
        
        self.btn_clear = PushButton("Limpiar")
        self.btn_clear.clicked.connect(self.clear_data)
        
        controls_layout.addWidget(self.btn_calc)
        controls_layout.addWidget(self.btn_clear)
        
        # Table (X, Y)
        self.table = QTableWidget(20, 2)
        self.table.setHorizontalHeaderLabels(["X", "Y (Opcional)"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.setStyleSheet("""
            QTableWidget {
                background-color: #2b2b2b;
                border: 1px solid #3e3e3e;
                border-radius: 6px;
                color: white;
            }
        """)
        
        left_layout.addWidget(controls_group)
        left_layout.addWidget(self.table)
        
        # Summary Stats Text
        self.summary_box = QGroupBox("Resumen")
        self.summary_layout = QVBoxLayout(self.summary_box)
        self.lbl_stats = BodyLabel("Ingresa datos para ver resultados...")
        self.lbl_stats.setWordWrap(True)
        self.summary_layout.addWidget(self.lbl_stats)
        left_layout.addWidget(self.summary_box)
        
        # --- RIGHT: Plot ---
        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(0,0,0,0)
        
        # Chart Type Selector
        chart_controls = QHBoxLayout()
        self.combo_chart = ComboBox()
        self.combo_chart.addItems(["Histograma (X)", "Caja y Bigotes (X)", "Dispersión (X vs Y)", "Regresión Lineal"])
        self.combo_chart.currentIndexChanged.connect(self.plot_data)
        chart_controls.addWidget(StrongBodyLabel("Gráfico:"))
        chart_controls.addWidget(self.combo_chart)
        chart_controls.addStretch()
        
        right_layout.addLayout(chart_controls)
        
        # Canvas
        self.figure = Figure(figsize=(5, 4), dpi=100, facecolor='#1a1a1a')
        self.canvas = FigureCanvasQTAgg(self.figure)
        self.ax = self.figure.add_subplot(111)
        self.style_axes()
        
        self.toolbar = NavigationToolbar2QT(self.canvas, self)
        self.toolbar.setStyleSheet("background-color: #ccc; color: black;")
        
        right_layout.addWidget(self.toolbar)
        right_layout.addWidget(self.canvas)
        
        # Splitter
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(left_panel)
        splitter.addWidget(right_panel)
        splitter.setStretchFactor(1, 4)
        
        main_layout.addWidget(splitter)
        
    def style_axes(self):
        self.ax.set_facecolor('#1a1a1a')
        self.ax.grid(True, linestyle='--', alpha=0.3)
        self.ax.tick_params(colors='white')
        self.ax.xaxis.label.set_color('white')
        self.ax.yaxis.label.set_color('white')
        self.ax.spines['bottom'].set_color('white')
        self.ax.spines['top'].set_color('white') 
        self.ax.spines['left'].set_color('white')
        self.ax.spines['right'].set_color('white')
        
    def get_data(self):
        x_data = []
        y_data = []
        
        for i in range(self.table.rowCount()):
            item_x = self.table.item(i, 0)
            item_y = self.table.item(i, 1)
            
            if item_x and item_x.text().strip():
                try:
                    val_x = float(item_x.text())
                    x_data.append(val_x)
                    
                    if item_y and item_y.text().strip():
                        val_y = float(item_y.text())
                        y_data.append(val_y)
                except ValueError:
                    pass # Skip invalid
                    
        return np.array(x_data), np.array(y_data)
        
    def clear_data(self):
        self.table.clearContents()
        self.lbl_stats.setText("Datos limpiados.")
        self.ax.clear()
        self.style_axes()
        self.canvas.draw()

    def calculate(self):
        x, y = self.get_data()
        
        if len(x) == 0:
            self.lbl_stats.setText("No hay datos válidos.")
            return
            
        # Basic stats for X
        stats_text = f"<b>Variable X (n={len(x)})</b><br>"
        stats_text += f"Media: {np.mean(x):.4f}<br>"
        stats_text += f"Mediana: {np.median(x):.4f}<br>"
        stats_text += f"Desv. Est: {np.std(x):.4f}<br>"
        stats_text += f"Varianza: {np.var(x):.4f}<br>"
        stats_text += f"Min: {np.min(x)} | Max: {np.max(x)}<br>"
        
        # Basic stats for Y if present
        if len(y) > 0 and len(y) == len(x):
            stats_text += "<br><b>Covarianza/Correlación</b><br>"
            corr = np.corrcoef(x, y)[0,1]
            stats_text += f"Correlación (r): {corr:.4f}<br>"
            
            # Linear Reg
            slope, intercept = np.polyfit(x, y, 1)
            stats_text += f"Recta: y = {slope:.2f}x + {intercept:.2f}"
            
        self.lbl_stats.setText(stats_text)
        self.plot_data()
        
    def plot_data(self, idx=None):
        x, y = self.get_data()
        if len(x) == 0: return
        
        chart_type = self.combo_chart.currentText()
        
        self.ax.clear()
        self.style_axes()
        
        color = '#EA580C'
        
        if "Histograma" in chart_type:
            self.ax.hist(x, bins='auto', color=color, alpha=0.7, edgecolor='white')
            self.ax.set_title("Distribución de X", color='white')
            
        elif "Caja" in chart_type:
            self.ax.boxplot(x, patch_artist=True, boxprops=dict(facecolor=color))
            self.ax.set_title("Boxplot X", color='white')
            
        elif "Dispersión" in chart_type:
            if len(y) == len(x) and len(y) > 0:
                self.ax.scatter(x, y, color=color)
                self.ax.set_xlabel("X")
                self.ax.set_ylabel("Y")
            else:
                self.ax.plot(x, np.zeros_like(x), 'o', color=color) # 1D scatter
                
        elif "Regresión" in chart_type:
            if len(y) == len(x) and len(y) > 1:
                self.ax.scatter(x, y, color='white', label='Datos')
                m, b = np.polyfit(x, y, 1)
                self.ax.plot(x, m*x + b, color=color, linewidth=2, label=f'y={m:.2f}x+{b:.2f}')
                self.ax.legend()
            else:
                self.ax.text(0.5, 0.5, "Se requieren datos X e Y", 
                             color='red', ha='center', transform=self.ax.transAxes)
                             
        self.canvas.draw()
